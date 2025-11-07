import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
	{
		email: {
			type: String,
			required: function() { return !this.googleId; },
			unique: true,
		},
		password: {
			type: String,
			required: function() { return !this.googleId; },
		},
		name: {
			type: String,
			required: true,
		},
		lastLogin: {
			type: Date,
			default: Date.now,
		},
		isVerified: {
			type: Boolean,
			default: false,
		},
		resetPasswordToken: String,
		resetPasswordExpiresAt: Date,
		verificationToken: String,
		verificationTokenExpiresAt: Date,
		// Google OAuth fields
		googleId: {
			type: String,
			unique: true,
			sparse: true
		},
		profilePicture: String,
	},
	{ timestamps: true }
);

// Indexes for performance optimization
userSchema.index({ email: 1 }); // For login and signup lookups
userSchema.index({ googleId: 1 }); // For Google OAuth lookups
userSchema.index({ verificationToken: 1, verificationTokenExpiresAt: 1 }); // For email verification with expiry check
userSchema.index({ resetPasswordToken: 1, resetPasswordExpiresAt: 1 }); // For password reset with expiry check

export const User = mongoose.model("User", userSchema);
