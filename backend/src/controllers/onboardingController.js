const onboardingService = require('../services/onboardingService');

const onboard = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await onboardingService.initializeOnboarding(userId, req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  onboard
};
