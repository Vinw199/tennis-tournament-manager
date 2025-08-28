import React, { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/Input'
import { EyeIcon, EyeOffIcon } from 'lucide-react'
import SubmitButton from '@/components/auth/SubmitButton'
import { useFormStatus } from 'react-dom'

const SignupFormFields = () => {

    const { pending } = useFormStatus();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
 
    const isFormValid = email.includes('@') && password.length >= 8 && password === confirm;

    return (
        <fieldset disabled={pending} className="space-y-4">
            {/* Email Input */}
            <div className="space-y-1">
                <Label htmlFor="email" className="text-sm text-foreground/70">Email</Label>
                <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className="w-full rounded-md border px-3 py-2"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
            </div>

            {/* Password Input */}
            <div className="space-y-1">
                <Label htmlFor="password" className="text-sm text-foreground/70">Password</Label>
                <div className="relative">
                    <Input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        className="w-full rounded-md border px-3 py-2"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                        type="button"
                        className={`absolute right-3 top-1/2 cursor-pointer -translate-y-1/2 text-foreground/50 ${password.length === 0 ? 'hidden' : ''}`}
                        onClick={() => setShowPassword(!showPassword)}
                    >
                        {showPassword ? <EyeIcon className="w-4 h-4" /> : <EyeOffIcon className="w-4 h-4" />}
                    </button>
                </div>
                {/* <p className="mt-1 text-xs text-foreground/60">At least 8 characters.</p> */}
            </div>

            {/* Confirm Password Input */}
            <div className="space-y-1">
                <Label htmlFor="confirm" className="text-sm text-foreground/70">Confirm Password</Label>
                <div className="relative">
                    <Input
                        id="confirm"
                        name="confirm"
                        type={showConfirm ? 'text' : 'password'}
                        required
                        className="w-full rounded-md border px-3 py-2"
                        placeholder="••••••••"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                    />
                    <button
                        type="button"
                        className={`absolute right-3 top-1/2 cursor-pointer -translate-y-1/2 text-foreground/50 ${confirm.length === 0 ? 'hidden' : ''}`}
                        onClick={() => setShowConfirm(!showConfirm)}
                    >
                        {showConfirm ? <EyeIcon className="w-4 h-4" /> : <EyeOffIcon className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
                <SubmitButton pendingText="Creating account..." pending={pending} disabled={!isFormValid} className="w-full cursor-pointer">
                    Create account
                </SubmitButton>
            </div>
        </fieldset>
    )
}

export default SignupFormFields