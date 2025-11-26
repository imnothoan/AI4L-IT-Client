/**
 * ERROR DISPLAY COMPONENT
 * Beautiful, user-friendly error messages with actions
 */

import React from 'react';

interface ErrorAction {
    type: string;
    label: string;
    variant?: 'primary' | 'secondary' | 'outline';
}

interface ErrorMessageProps {
    title: string;
    message: string | ((data: any) => string);
    suggestion?: string;
    actions?: ErrorAction[];
    tips?: string[];
    severity?: 'error' | 'warning' | 'info';
    onAction?: (actionType: string) => void;
}

export const ErrorDisplay: React.FC<ErrorMessageProps> = ({
    title,
    message,
    suggestion,
    actions = [],
    tips = [],
    severity = 'error',
    onAction
}) => {
    const getSeverityStyles = () => {
        switch (severity) {
            case 'error':
                return {
                    bg: 'bg-red-50',
                    border: 'border-red-200',
                    icon: 'text-red-600',
                    title: 'text-red-900',
                    text: 'text-red-800'
                };
            case 'warning':
                return {
                    bg: 'bg-yellow-50',
                    border: 'border-yellow-200',
                    icon: 'text-yellow-600',
                    title: 'text-yellow-900',
                    text: 'text-yellow-800'
                };
            case 'info':
                return {
                    bg: 'bg-blue-50',
                    border: 'border-blue-200',
                    icon: 'text-blue-600',
                    title: 'text-blue-900',
                    text: 'text-blue-800'
                };
        }
    };

    const styles = getSeverityStyles();

    const getButtonStyles = (variant: string = 'primary') => {
        switch (variant) {
            case 'primary':
                return 'bg-blue-600 hover:bg-blue-700 text-white';
            case 'secondary':
                return 'bg-gray-200 hover:bg-gray-300 text-gray-800';
            case 'outline':
                return 'border-2 border-gray-300 hover:border-gray-400 text-gray-700 bg-white';
            default:
                return 'bg-blue-600 hover:bg-blue-700 text-white';
        }
    };

    const getSeverityIcon = () => {
        switch (severity) {
            case 'error':
                return (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                );
            case 'warning':
                return (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                );
            case 'info':
                return (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
        }
    };

    return (
        <div className={`rounded-lg border-2 ${styles.border} ${styles.bg} p-6 shadow-lg animate-fade-in`}>
            <div className="flex items-start space-x-4">
                <div className={`flex-shrink-0 ${styles.icon}`}>
                    {getSeverityIcon()}
                </div>

                <div className="flex-1">
                    {/* Title */}
                    <h3 className={`text-lg font-semibold ${styles.title} mb-2`}>
                        {title}
                    </h3>

                    {/* Message */}
                    <p className={`text-sm ${styles.text} mb-3`}>
                        {typeof message === 'function' ? message({}) : message}
                    </p>

                    {/* Suggestion */}
                    {suggestion && (
                        <p className={`text-sm ${styles.text} font-medium mb-4`}>
                            💡 {suggestion}
                        </p>
                    )}

                    {/* Tips */}
                    {tips.length > 0 && (
                        <div className={`text-sm ${styles.text} mb-4 bg-white bg-opacity-50 rounded-md p-3`}>
                            <p className="font-semibold mb-2">💭 Gợi ý:</p>
                            <ul className="list-disc list-inside space-y-1">
                                {tips.map((tip, index) => (
                                    <li key={index}>{tip}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Actions */}
                    {actions.length > 0 && (
                        <div className="flex flex-wrap gap-3 mt-4">
                            {actions.map((action, index) => (
                                <button
                                    key={index}
                                    onClick={() => onAction && onAction(action.type)}
                                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 transform hover:scale-105 ${getButtonStyles(action.variant)}`}
                                >
                                    {action.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Close button (optional) */}
                <button
                    onClick={() => onAction && onAction('CLOSE')}
                    className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

/**
 * PASSWORD STRENGTH METER COMPONENT
 */
interface PasswordStrengthProps {
    password: string;
    showRequirements?: boolean;
}

export const PasswordStrength: React.FC<PasswordStrengthProps> = ({
    password,
    showRequirements = true
}) => {
    const requirements = [
        {
            met: password.length >= 8,
            text: 'Ít nhất 8 ký tự',
            icon: password.length >= 8 ? '✅' : '⭕'
        },
        {
            met: /[A-Z]/.test(password),
            text: 'Có chữ hoa',
            icon: /[A-Z]/.test(password) ? '✅' : '⭕'
        },
        {
            met: /[a-z]/.test(password),
            text: 'Có chữ thường',
            icon: /[a-z]/.test(password) ? '✅' : '⭕'
        },
        {
            met: /\d/.test(password),
            text: 'Có số',
            icon: /\d/.test(password) ? '✅' : '⭕'
        },
        {
            met: /[@$!%*?&]/.test(password),
            text: 'Có ký tự đặc biệt (!@#$%^&*)',
            icon: /[@$!%*?&]/.test(password) ? '✅' : '⭕'
        }
    ];

    const strength = requirements.filter(r => r.met).length;
    const strengthPercent = (strength / requirements.length) * 100;

    const getStrengthColor = () => {
        if (strength === 0) return 'bg-gray-200';
        if (strength <= 2) return 'bg-red-500';
        if (strength <= 3) return 'bg-yellow-500';
        if (strength <= 4) return 'bg-blue-500';
        return 'bg-green-500';
    };

    const getStrengthText = () => {
        if (strength === 0) return { text: 'Chưa nhập', color: 'text-gray-500' };
        if (strength <= 2) return { text: 'Yếu', color: 'text-red-600' };
        if (strength <= 3) return { text: 'Trung bình', color: 'text-yellow-600' };
        if (strength <= 4) return { text: 'Khá', color: 'text-blue-600' };
        return { text: 'Mạnh', color: 'text-green-600' };
    };

    const strengthInfo = getStrengthText();

    if (!password && !showRequirements) return null;

    return (
        <div className="space-y-3">
            {/* Strength Bar */}
            {password && (
                <div className="space-y-1">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Độ mạnh mật khẩu:</span>
                        <span className={`font-semibold ${strengthInfo.color}`}>
                            {strengthInfo.text}
                        </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                        <div
                            className={`h-full ${getStrengthColor()} transition-all duration-300 rounded-full`}
                            style={{ width: `${strengthPercent}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Requirements Checklist */}
            {showRequirements && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-sm font-semibold text-gray-700 mb-2">
                        Yêu cầu mật khẩu:
                    </p>
                    <ul className="space-y-1.5">
                        {requirements.map((req, index) => (
                            <li
                                key={index}
                                className={`text-sm flex items-center space-x-2 ${req.met ? 'text-green-700' : 'text-gray-500'
                                    }`}
                            >
                                <span className="text-lg">{req.icon}</span>
                                <span>{req.text}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

/**
 * REAL-TIME VALIDATION INPUT COMPONENT
 */
interface ValidatedInputProps {
    type: string;
    value: string;
    onChange: (value: string) => void;
    label: string;
    placeholder?: string;
    validation?: (value: string) => { valid: boolean; message?: string };
    required?: boolean;
    autoFocus?: boolean;
}

export const ValidatedInput: React.FC<ValidatedInputProps> = ({
    type,
    value,
    onChange,
    label,
    placeholder,
    validation,
    required = false,
    autoFocus = false
}) => {
    const [touched, setTouched] = React.useState(false);
    const [validationResult, setValidationResult] = React.useState<{
        valid: boolean;
        message?: string;
    }>({ valid: true });

    React.useEffect(() => {
        if (validation && touched) {
            const result = validation(value);
            setValidationResult(result);
        }
    }, [value, validation, touched]);

    const showError = touched && !validationResult.valid;
    const showSuccess = touched && validationResult.valid && value.length > 0;

    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
            </label>

            <div className="relative">
                <input
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onBlur={() => setTouched(true)}
                    placeholder={placeholder}
                    autoFocus={autoFocus}
                    className={`
            w-full px-4 py-3 rounded-lg border-2 transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-offset-1
            ${showError ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : ''}
            ${showSuccess ? 'border-green-300 focus:border-green-500 focus:ring-green-200' : ''}
            ${!touched ? 'border-gray-300 focus:border-blue-500 focus:ring-blue-200' : ''}
          `}
                />

                {/* Validation Icon */}
                {touched && value && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {showError && (
                            <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        )}
                        {showSuccess && (
                            <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        )}
                    </div>
                )}
            </div>

            {/* Validation Message */}
            {showError && validationResult.message && (
                <p className="text-sm text-red-600 flex items-center space-x-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{validationResult.message}</span>
                </p>
            )}
        </div>
    );
};

// CSS for animations (add to global styles)
export const errorAnimationStyles = `
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fade-in 0.3s ease-out;
}
`;
