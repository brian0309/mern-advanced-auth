import React from "react";
import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, Loader } from "lucide-react";
import { Link } from "react-router-dom";
import Input from "../components/Input";
import { useAuthStore } from "../store/authStore";
import GoogleLoginButton from "../components/GoogleLoginButton";

const LoginPage: React.FC = () => {
	const [email, setEmail] = useState<string>("");
	const [password, setPassword] = useState<string>("");

	const { login, isLoading, error } = useAuthStore();

	const handleLogin = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
		e.preventDefault();
		await login(email, password);
	};

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.5 }}
			className='max-w-md w-full bg-background-paper border border-gray-200 rounded-2xl shadow-lg overflow-hidden'
		>
			<div className='p-8'>
				<h2 className='text-3xl font-bold mb-6 text-center text-primary'>
					Welcome Back
				</h2>

				<form onSubmit={handleLogin}>
					<Input
						icon={Mail}
						type='email'
						placeholder='Email Address'
						value={email}
						onChange={(e) => setEmail(e.target.value)}
					/>

					<Input
						icon={Lock}
						type='password'
						placeholder='Password'
						value={password}
						onChange={(e) => setPassword(e.target.value)}
					/>

					<div className='flex items-center mb-6'>
						<Link to='/forgot-password' className='text-sm text-primary hover:underline'>
							Forgot password?
						</Link>
					</div>
					{error && <p className='text-error font-semibold mb-2'>{error}</p>}

					<motion.button
						whileHover={{ scale: 1.02 }}
						whileTap={{ scale: 0.98 }}
						className='w-full py-3 px-4 bg-primary text-text-contrast font-bold rounded-lg shadow hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition duration-200'
						type='submit'
						disabled={isLoading}
					>
						{isLoading ? <Loader className='w-6 h-6 animate-spin  mx-auto' /> : "Login"}
					</motion.button>

					<div className="relative my-6">
						<div className="absolute inset-0 flex items-center">
							<div className="w-full border-t border-gray-300"></div>
						</div>
						<div className="relative flex justify-center text-sm">
							<span className="px-2 bg-background-paper text-text-secondary">Or continue with</span>
						</div>
					</div>

					<GoogleLoginButton />
				</form>
			</div>
			<div className='px-8 py-4 bg-background-paper border-t border-gray-200 flex justify-center'>
				<p className='text-sm text-text-secondary'>
					Don't have an account?{" "}
					<Link to='/signup' className='text-primary hover:underline'>
						Sign up
					</Link>
				</p>
			</div>
		</motion.div>
	);
};
export default LoginPage;
