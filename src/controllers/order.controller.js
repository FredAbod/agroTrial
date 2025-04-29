const Order = require('../models/Order');
const Item = require('../models/Item');
const Notification = require('../models/Notification');
const User = require('../models/User');
const logger = require('../utils/logger');

/**
 * Create a new order
 */
const createOrder = async (req, res, next) => {
  try {
    const customerId = req.userId;
    const { items, deliveryAddress, paymentMethod, contactPhone, notes } = req.body;
    
    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Order must contain at least one item' });
    }
    
    // Validate items and calculate total
    let totalAmount = 0;
    const orderItems = [];
    let farmerId;
    
    // We're assuming all items in a single order are from the same farmer
    for (const orderItem of items) {
      const item = await Item.findById(orderItem.itemId);
      
      if (!item) {
        return res.status(404).json({ message: `Item with ID ${orderItem.itemId} not found` });
      }
      
      if (!item.available || item.quantity < orderItem.quantity) {
        return res.status(400).json({ 
          message: `Item ${item.name} is not available or has insufficient quantity` 
        });
      }
      
      // Set farmer ID from first item (all should be from same farmer)
      if (!farmerId) {
        farmerId = item.farmerId;
      } else if (farmerId.toString() !== item.farmerId.toString()) {
        return res.status(400).json({ 
          message: 'All items in an order must be from the same farmer' 
        });
      }
      
      const itemTotal = item.price * orderItem.quantity;
      totalAmount += itemTotal;
      
      orderItems.push({
        itemId: item._id,
        quantity: orderItem.quantity,
        price: item.price,
        name: item.name,
        unit: item.unit
      });
      
      // Reduce item quantity
      item.quantity -= orderItem.quantity;
      if (item.quantity === 0) {
        item.available = false;
      }
      await item.save();
    }
    
    // Create the order
    const order = new Order({
      customerId,
      items: orderItems,
      farmerId,
      totalAmount,
      deliveryAddress,
      paymentMethod,
      contactPhone,
      notes,
      paymentStatus: 'pending'
    });
    
    await order.save();
    
    // Create notification for the farmer
    const farmer = await User.findOne({ _id: farmerId });
    if (farmer) {
      const notification = new Notification({
        userId: farmer._id,
        title: 'New Order Received',
        message: `You have received a new order for $${totalAmount.toFixed(2)}`,
        type: 'order',
        relatedTo: { orderId: order._id }
      });
      
      await notification.save();
    }
    
    res.status(201).json({
      message: 'Order created successfully',
      order
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all orders for the current user
 */
const getUserOrders = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { status, page = 1, limit = 10 } = req.query;
    
    // Build query based on user role
    const query = {};
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (user.role === 'consumer') {
      query.customerId = userId;
    } else if (user.role === 'farmer') {
      // Find farmer ID for this user
      const farmer = await Farmer.findOne({ userId });
      if (!farmer) {
        return res.status(404).json({ message: 'Farmer profile not found' });
      }
      query.farmerId = farmer._id;
    }
    
    // Filter by status if provided
    if (status) {
      query.status = status;
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Find orders with pagination
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .populate('customerId', 'name email')
      .populate('farmerId', 'farmName');
    
    // Count total matching orders
    const total = await Order.countDocuments(query);
    
    res.json({
      orders,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get order details by ID
 */
const getOrderById = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const userId = req.userId;
    
    const order = await Order.findById(orderId)
      .populate('customerId', 'name email')
      .populate('farmerId', 'farmName userId');
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Check if user is authorized to view this order
    const user = await User.findById(userId);
    
    if (
      order.customerId._id.toString() !== userId && // Not the customer
      order.farmerId.userId.toString() !== userId && // Not the farmer
      user.role !== 'admin' // Not an admin
    ) {
      return res.status(403).json({ message: 'Not authorized to view this order' });
    }
    
    res.json({ order });
  } catch (error) {
    next(error);
  }
};

/**
 * Update order status (for farmers)
 */
const updateOrderStatus = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    const userId = req.userId;
    
    if (!status || !['confirmed', 'shipped', 'delivered', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }
    
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Check if farmer is authorized to update this order
    const farmer = await Farmer.findOne({ userId });
    
    if (!farmer || farmer._id.toString() !== order.farmerId.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this order' });
    }
    
    // Update order status
    order.status = status;
    await order.save();
    
    // Create notification for the customer
    const notification = new Notification({
      userId: order.customerId,
      title: `Order ${status}`,
      message: `Your order has been ${status}`,
      type: 'order',
      relatedTo: { orderId: order._id }
    });
    
    await notification.save();
    
    res.json({
      message: 'Order status updated successfully',
      order
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel an order (for customers)
 */
const cancelOrder = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const userId = req.userId;
    
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Check if user is the customer who placed this order
    if (order.customerId.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to cancel this order' });
    }
    
    // Only allow cancellation if order is still pending
    if (order.status !== 'pending') {
      return res.status(400).json({ 
        message: 'Cannot cancel order that has been confirmed, shipped, or delivered' 
      });
    }
    
    // Update order status
    order.status = 'cancelled';
    await order.save();
    
    // Return items to inventory
    for (const item of order.items) {
      const productItem = await Item.findById(item.itemId);
      if (productItem) {
        productItem.quantity += item.quantity;
        productItem.available = true;
        await productItem.save();
      }
    }
    
    // Create notification for the farmer
    const farmer = await User.findOne({ _id: order.farmerId });
    if (farmer) {
      const notification = new Notification({
        userId: farmer._id,
        title: 'Order Cancelled',
        message: `Order #${order._id} has been cancelled by the customer`,
        type: 'order',
        relatedTo: { orderId: order._id }
      });
      
      await notification.save();
    }
    
    res.json({
      message: 'Order cancelled successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getUserOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder
};