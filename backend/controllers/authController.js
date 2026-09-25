const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const crypto = require("crypto");
const generateResetToken = require("../utils/generateResetToken");

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const { fullName, mobileNumber, email, password } = req.body;

    if (!fullName || !mobileNumber || !email || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Full name, mobile number, email, and password are all required",
      });
    }

    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { mobileNumber }],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "A user with this email or mobile number already exists",
      });
    }

    const user = await User.create({ fullName, mobileNumber, email, password });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        user: {
          id: user._id,
          fullName: user.fullName,
          mobileNumber: user.mobileNumber,
          email: user.email,
          role: user.role,
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login with mobile number/email + password
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { identifier, password } = req.body; // identifier = mobile number OR email

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: "Identifier (mobile/email) and password are required",
      });
    }

    const user = await User.findOne({
      $or: [{ email: identifier.toLowerCase() }, { mobileNumber: identifier }],
    }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "This account has been deactivated",
      });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: user._id,
          fullName: user.fullName,
          mobileNumber: user.mobileNumber,
          email: user.email,
          role: user.role,
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout (stateless JWT — client discards token; endpoint exists for
//          consistency and to support future token-blacklisting if needed)
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged-in user's profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        id: req.user._id,
        fullName: req.user.fullName,
        mobileNumber: req.user.mobileNumber,
        email: req.user.email,
        role: req.user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Request a password reset — generates a token (in a real deployment
//          this would be emailed/SMS'd; for now it's returned in the response
//          so the mobile app / Postman can complete the flow during dev & demo)
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res, next) => {
  try {
    const { identifier } = req.body; // mobile number OR email
    if (!identifier) {
      return res.status(400).json({ success: false, message: "Mobile number or email is required" });
    }

    const user = await User.findOne({
      $or: [{ email: identifier.toLowerCase() }, { mobileNumber: identifier }],
    });

    // Always respond the same way whether or not the user exists, to avoid
    // leaking which accounts are registered
    if (!user) {
      return res.status(200).json({
        success: true,
        message: "If an account exists for that mobile number/email, reset instructions have been sent",
      });
    }

    const { rawToken, hashedToken } = generateResetToken();
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 minutes
    await user.save();

    // TODO (production): send `rawToken` via SMS/email instead of returning it.
    res.status(200).json({
      success: true,
      message: "If an account exists for that mobile number/email, reset instructions have been sent",
      // Dev/demo convenience only — remove `resetToken` from the response once
      // real SMS/email delivery is wired up:
      resetToken: rawToken,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password using the token from forgotPassword
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ success: false, message: "Token and new password are required" });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    }).select("+resetPasswordToken +resetPasswordExpire");

    if (!user) {
      return res.status(400).json({ success: false, message: "Reset link is invalid or has expired" });
    }

    user.password = newPassword; // pre("save") hook hashes it
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({ success: true, message: "Password reset successful — please log in" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
};
