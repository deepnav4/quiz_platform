export function validate(schema) {
  return (req, res, next) => {
    const errors = [];
    for (const [field, rules] of Object.entries(schema)) {
      const value = req.body[field];
      if (rules.required && (value === undefined || value === null || value === "")) {
        errors.push(`${field} is required`);
      }
      if (rules.type && value !== undefined && typeof value !== rules.type) {
        errors.push(`${field} must be of type ${rules.type}`);
      }
      if (rules.minLength && typeof value === "string" && value.length < rules.minLength) {
        errors.push(`${field} must be at least ${rules.minLength} characters`);
      }
    }
    if (errors.length > 0) {
      return res.status(400).json({ message: errors.join(", ") });
    }
    next();
  };
}
