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

export const User = mongoose.model("User", userSchema);
