import mongoose, { Schema } from "mongoose";
import { IUserDocument } from "../types/user.types.js";

const userSchema = new Schema<IUserDocument>(
	{
		email: {
			type: String,
			required: function(this: IUserDocument) { return !this.googleId; },
			unique: true,
		},
		password: {
			type: String,
			required: function(this: IUserDocument) { return !this.googleId; },
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
userSchema.index({ verificationToken: 1, verificationTokenExpiresAt: 1 }); // For email verification with expiry check
userSchema.index({ resetPasswordToken: 1, resetPasswordExpiresAt: 1 }); // For password reset with expiry check

export const User = mongoose.model<IUserDocument>("User", userSchema);
