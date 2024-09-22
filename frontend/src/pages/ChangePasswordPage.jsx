import { useState } from "react";
import { motion } from "framer-motion";
import { useAuthStore } from "../store/authStore";
import Input from "../components/Input";
import { Lock } from "lucide-react";
import toast from "react-hot-toast";
import PasswordStrengthMeter from "../components/PasswordStrengthMeter";

const ChangePasswordPage = () => {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmNewPassword, setConfirmNewPassword] = useState("");
    const [formError, setFormError] = useState(""); // State to manage form error
    const { changePassword, clearError, error, isLoading } = useAuthStore();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError(""); // Reset form error
        clearError(); // Clear the error from the store

        if (newPassword !== confirmNewPassword) {
            setFormError("New passwords do not match");
            return;
        }
        try {
            await changePassword(currentPassword, newPassword);
            toast.success("Password changed successfully");
        } catch (error) {
            console.error(error);
            if (error.response && error.response.status === 400) {
                setFormError("Current password is incorrect");
            } else {
                setFormError(error.message || "Error changing password");
            }
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className='max-w-md w-full bg-gray-800 bg-opacity-50 backdrop-filter backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden'
        >
            <div className='p-8'>
                <h2 className='text-3xl font-bold mb-6 text-center bg-gradient-to-r from-green-400 to-emerald-500 text-transparent bg-clip-text'>
                    Change Password
                </h2>
                {formError && <p className='text-red-500 text-sm mb-4'>{formError}</p>} {/* Display form error */}
                {!formError && error && <p className='text-red-500 text-sm mb-4'>{error}</p>}

                <form onSubmit={handleSubmit}>
                    <Input
                        icon={Lock}
                        type='password'
                        placeholder='Current Password'
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                    />
                    <Input
                        icon={Lock}
                        type='password'
                        placeholder='New Password'
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                    />
                    <div className='mb-4'>
                        <PasswordStrengthMeter password={newPassword} />
                    </div>
                    <Input
                        icon={Lock}
                        type='password'
                        placeholder='Confirm New Password'
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        required
                    />
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className='w-full py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-lg shadow-lg hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition duration-200'
                        type='submit'
                        disabled={isLoading}
                    >
                        {isLoading ? "Changing..." : "Change Password"}
                    </motion.button>
                </form>
            </div>
        </motion.div>
    );
};

export default ChangePasswordPage;
