/**
 * Validation middleware generator
 * @param {Function} validator - Validation function that returns errors if validation fails
 */
const validate = (validator) => {
  return (req, res, next) => {
    const { error, value } = validator(req.body);
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return res.status(400).json({
        message: 'Validation error',
        errors
      });
    }
    
    // Replace req.body with validated value
    req.body = value;
    next();
  };
};

module.exports = validate;