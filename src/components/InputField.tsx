import React, { useState } from 'react';

interface InputFieldProps {
    value: string;
    onChange: (value: string) => void;
    label: string;
    type?: string;
    required?: boolean;
}

const InputField: React.FC<InputFieldProps> = ({ value, onChange, label, type = 'text', required = false }) => {
    const [error, setError] = useState<string | null>(null);

    const handleValidation = (value: string) => {
        // Example validation: Check if required field is empty
        if (required && value.trim() === '') {
            setError(`${label} is required`);
        } else {
            setError(null);
        }
    };

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = event.target.value;
        onChange(newValue);
        handleValidation(newValue);
    };

    return (
        <div>
            <label>
                {label}:
                <input
                    type={type}
                    value={value}
                    onChange={handleChange}
                    aria-describedby={error ? `${label}-error` : undefined}
                    aria-invalid={Boolean(error)}
                    required={required}
                />
            </label>
            {error && <span id={`${label}-error`} style={{ color: 'red' }}>{error}</span>}
        </div>
    );
};

export default InputField;