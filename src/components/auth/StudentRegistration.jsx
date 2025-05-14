import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Check, AlertCircle, UserPlus, ArrowRight, Eye, EyeOff } from 'lucide-react';

const StudentRegistration = () => {
  const [formFields, setFormFields] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  // Fetch form fields from backend
  useEffect(() => {
    const fetchFormFields = async () => {
      setIsLoading(true);
      try {
        // Using fallback form fields since the registration-fields endpoint doesn't exist
        setFormFields(getDefaultFormFields());
      } catch (error) {
        console.error('Error fetching form fields:', error);
        // Fallback to default fields if API fails
        setFormFields(getDefaultFormFields());
      } finally {
        setIsLoading(false);
      }
    };

    fetchFormFields();
  }, []);

  // Default form fields in case API call fails
  const getDefaultFormFields = () => {
    return [
      { name: 'firstName', label: 'First Name', type: 'text', required: true },
      { name: 'lastName', label: 'Last Name', type: 'text', required: true },
      { name: 'email', label: 'Email Address', type: 'email', required: true },
      { name: 'password', label: 'Password', type: 'password', required: true },
      { name: 'confirmPassword', label: 'Confirm Password', type: 'password', required: true },
      
      // Personal information
      { name: 'phone_number', label: 'Phone Number', type: 'text', required: false },
      { name: 'date_of_birth', label: 'Date of Birth', type: 'date', required: false },
      { name: 'street_address', label: 'Street Address', type: 'text', required: false },
      
      // Learning style preferences - scale 1 to 5
      { 
        name: 'visual_learning_preference', 
        label: 'Visual Learning Preference', 
        type: 'slider', 
        min: 1, 
        max: 5, 
        defaultValue: 3,
        required: true,
        description: 'How much do you prefer learning through visual materials like charts, diagrams, and videos?'
      },
      { 
        name: 'auditory_learning_preference', 
        label: 'Auditory Learning Preference', 
        type: 'slider', 
        min: 1, 
        max: 5, 
        defaultValue: 3,
        required: true,
        description: 'How much do you prefer learning by listening to lectures and discussions?'
      },
      { 
        name: 'reading_learning_preference', 
        label: 'Reading/Writing Learning Preference', 
        type: 'slider', 
        min: 1, 
        max: 5, 
        defaultValue: 3,
        required: true,
        description: 'How much do you prefer learning through reading and writing?'
      },
      { 
        name: 'kinesthetic_learning_preference', 
        label: 'Hands-on Learning Preference', 
        type: 'slider', 
        min: 1, 
        max: 5, 
        defaultValue: 3,
        required: true,
        description: 'How much do you prefer learning by doing and hands-on activities?'
      },
      // Subject preferences - scale 1 to 5
      { 
        name: 'math_preference', 
        label: 'Mathematics Interest', 
        type: 'slider', 
        min: 1, 
        max: 5, 
        defaultValue: 3,
        required: true,
        description: 'How interested are you in mathematics?'
      },
      { 
        name: 'science_preference', 
        label: 'Science Interest', 
        type: 'slider', 
        min: 1, 
        max: 5, 
        defaultValue: 3,
        required: true,
        description: 'How interested are you in science subjects?'
      },
      { 
        name: 'language_preference', 
        label: 'Language Interest', 
        type: 'slider', 
        min: 1, 
        max: 5, 
        defaultValue: 3,
        required: true,
        description: 'How interested are you in languages and literature?'
      },
      { 
        name: 'humanities_preference', 
        label: 'Humanities Interest', 
        type: 'slider', 
        min: 1, 
        max: 5, 
        defaultValue: 3,
        required: true,
        description: 'How interested are you in humanities subjects (history, social studies, etc.)?'
      },
      // Learning pace and style
      { 
        name: 'preferred_pace',
        label: 'Preferred Learning Pace', 
        type: 'select', 
        options: ['slow', 'moderate', 'fast'], 
        required: true,
        description: 'What speed of learning do you prefer?'
      },
      { 
        name: 'preferred_communication_style', 
        label: 'Preferred Communication Style', 
        type: 'select', 
        options: ['interactive', 'lecture', 'discussion', 'visual'], 
        required: true,
        description: 'How do you prefer to communicate during learning?'
      }
    ];
  };

  // Dynamic validation schema based on form fields
  const generateValidationSchema = () => {
    const schemaFields = {};

    formFields.forEach(field => {
      let validator;

      switch (field.type) {
        case 'email':
          validator = Yup.string()
            .email('Please enter a valid email address')
            .required('Email address is required');
          break;
        case 'password':
          validator = Yup.string()
            .min(8, 'Password must be at least 8 characters')
            .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
            .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
            .matches(/[0-9]/, 'Password must contain at least one number')
            .matches(/[^A-Za-z0-9]/, 'Password must contain at least one special character')
            .required('Password is required');
          break;
        case 'confirmPassword':
          validator = Yup.string()
            .oneOf([Yup.ref('password'), null], 'Passwords must match')
            .required('Please confirm your password');
          break;
        case 'select':
          validator = Yup.string().required(`${field.label} is required`);
          break;
        case 'slider':
          validator = Yup.number()
            .min(field.min || 1, `Minimum value is ${field.min || 1}`)
            .max(field.max || 5, `Maximum value is ${field.max || 5}`)
            .required(`${field.label} is required`);
          break;
        case 'multiselect':
          validator = field.required 
            ? Yup.array().min(1, `Please select at least one ${field.label.toLowerCase()}`)
            : Yup.array();
          break;
        default:
          validator = field.required 
            ? Yup.string().required(`${field.label} is required`) 
            : Yup.string();
      }

      schemaFields[field.name] = validator;
    });

    return Yup.object().shape(schemaFields);
  };

  // Initialize form with Formik
  const formik = useFormik({
    initialValues: formFields.reduce((acc, field) => {
      if (field.type === 'multiselect') {
        acc[field.name] = [];
      } else if (field.type === 'slider') {
        acc[field.name] = field.defaultValue || 3;
      } else {
        acc[field.name] = '';
      }
      return acc;
    }, {}),
    validationSchema: generateValidationSchema(),
    enableReinitialize: true,
    onSubmit: async (values) => {
      setIsLoading(true);
      setSubmitStatus(null);
      
      try {
        // Map the form values to the backend's expected format
        const formattedData = {
          email: values.email,
          password: values.password,
          first_name: values.firstName,
          last_name: values.lastName,
          
          // Personal information
          phone_number: values.phone_number || '',
          date_of_birth: values.date_of_birth || null,
          street_address: values.street_address || '',
          
          role: 'student', // Make sure to specify role
          // Learning preferences directly from form
          visual_learning_preference: parseInt(values.visual_learning_preference) || 3,
          auditory_learning_preference: parseInt(values.auditory_learning_preference) || 3,
          reading_learning_preference: parseInt(values.reading_learning_preference) || 3,
          kinesthetic_learning_preference: parseInt(values.kinesthetic_learning_preference) || 3,
          // Subject preferences directly from form
          math_preference: parseInt(values.math_preference) || 3,
          science_preference: parseInt(values.science_preference) || 3,
          language_preference: parseInt(values.language_preference) || 3,
          humanities_preference: parseInt(values.humanities_preference) || 3,
          // Learning style
          preferred_pace: values.preferred_pace || 'moderate',
          preferred_communication_style: values.preferred_communication_style || 'interactive'
        };
        
        // Fixed API endpoint to match backend URL patterns - removed 'api/' prefix
        const response = await axios.post('http://localhost:8000/register/student/', formattedData);
        
        setSubmitStatus({
          success: true,
          message: 'Registration successful! Redirecting to login...'
        });
        
        // Redirect to login after successful registration
        setTimeout(() => {
          navigate('/login');
        }, 2000);
        
      } catch (error) {
        console.error('Registration error:', error);
        let errorMessage = 'Registration failed. Please try again.';
        
        if (error.response) {
          if (error.response.data) {
            // Try to extract meaningful error messages
            const errorData = error.response.data;
            if (typeof errorData === 'string') {
              errorMessage = errorData;
            } else if (errorData.detail) {
              errorMessage = errorData.detail;
            } else if (errorData.email) {
              errorMessage = `Email error: ${errorData.email[0]}`;
            } else if (errorData.password) {
              errorMessage = `Password error: ${errorData.password[0]}`;
            } else if (errorData.non_field_errors) {
              errorMessage = errorData.non_field_errors[0];
            } else {
              // Try to find any error in the response
              const firstError = Object.entries(errorData).find(([_, value]) => value && value.length > 0);
              if (firstError) {
                errorMessage = `${firstError[0]}: ${firstError[1][0]}`;
              }
            }
          }
        }
        
        setSubmitStatus({
          success: false,
          message: errorMessage
        });
      } finally {
        setIsLoading(false);
      }
    }
  });

  // Render form field based on type
  const renderField = (field) => {
    const hasError = formik.touched[field.name] && formik.errors[field.name];
    
    switch (field.type) {
      case 'password':
        return (
          <div className="relative">
            <input
              id={field.name}
              name={field.name}
              type={field.name === 'password' ? (showPassword ? 'text' : 'password') : (showConfirmPassword ? 'text' : 'password')}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values[field.name] || ''}
              className={`w-full px-4 py-3 border rounded-xl transition-all duration-300 focus:ring-2 focus:ring-blue-500 outline-none ${
                hasError ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder={field.label}
              aria-label={field.label}
              aria-invalid={hasError ? 'true' : 'false'}
              aria-describedby={`${field.name}-error`}
            />
            <button
              type="button"
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
              onClick={() => field.name === 'password' ? setShowPassword(!showPassword) : setShowConfirmPassword(!showConfirmPassword)}
              aria-label={field.name === 'password' ? (showPassword ? 'Hide password' : 'Show password') : (showConfirmPassword ? 'Hide confirm password' : 'Show confirm password')}
            >
              {field.name === 'password' ? (
                showPassword ? <EyeOff size={20} /> : <Eye size={20} />
              ) : (
                showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />
              )}
            </button>
          </div>
        );
        
      case 'select':
        return (
          <div>
            {field.description && (
              <p className="text-sm text-gray-500 mb-2">{field.description}</p>
            )}
            <select
              id={field.name}
              name={field.name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values[field.name] || ''}
              className={`w-full px-4 py-3 border rounded-xl transition-all duration-300 focus:ring-2 focus:ring-blue-500 outline-none ${
                hasError ? 'border-red-500' : 'border-gray-300'
              }`}
              aria-label={field.label}
              aria-invalid={hasError ? 'true' : 'false'}
              aria-describedby={`${field.name}-error`}
            >
              <option value="" disabled>Select {field.label}</option>
              {field.options.map((option) => (
                <option key={option} value={option}>
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </option>
              ))}
            </select>
          </div>
        );
        
      case 'slider':
        return (
          <div>
            {field.description && (
              <p className="text-sm text-gray-500 mb-2">{field.description}</p>
            )}
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-500">Low</span>
              <span className="text-xs text-gray-500">High</span>
            </div>
            <div className="flex items-center">
              <input
                id={field.name}
                name={field.name}
                type="range"
                min={field.min || 1}
                max={field.max || 5}
                step="1"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values[field.name] || field.defaultValue || 3}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                aria-label={field.label}
                aria-invalid={hasError ? 'true' : 'false'}
                aria-describedby={`${field.name}-error`}
              />
              <span className="ml-3 text-blue-600 font-medium">
                {formik.values[field.name] || field.defaultValue || 3}
              </span>
            </div>
          </div>
        );
        
      case 'multiselect':
        return (
          <div className="flex flex-wrap gap-2 border rounded-xl p-3 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
            {field.options.map((option) => (
              <div
                key={option}
                className="flex items-center"
              >
                <input
                  id={`${field.name}-${option}`}
                  type="checkbox"
                  name={field.name}
                  value={option}
                  onChange={() => {
                    // Make sure formik.values[field.name] is an array
                    const currentValues = Array.isArray(formik.values[field.name]) ? [...formik.values[field.name]] : [];
                    const index = currentValues.indexOf(option);
                    
                    if (index === -1) {
                      currentValues.push(option);
                    } else {
                      currentValues.splice(index, 1);
                    }
                    
                    formik.setFieldValue(field.name, currentValues);
                  }}
                  checked={Array.isArray(formik.values[field.name]) && formik.values[field.name].includes(option)}
                  className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label
                  htmlFor={`${field.name}-${option}`}
                  className="ml-2 text-sm text-gray-700"
                >
                  {option}
                </label>
              </div>
            ))}
          </div>
        );
        
      default:
        return (
          <input
            id={field.name}
            name={field.name}
            type={field.type}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            value={formik.values[field.name] || ''}
            className={`w-full px-4 py-3 border rounded-xl transition-all duration-300 focus:ring-2 focus:ring-blue-500 outline-none ${
              hasError ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder={field.label}
            aria-label={field.label}
            aria-invalid={hasError ? 'true' : 'false'}
            aria-describedby={`${field.name}-error`}
          />
        );
    }
  };

  // Animation variants
  const formVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const fieldVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  const buttonVariants = {
    rest: { scale: 1 },
    hover: { scale: 1.05 },
    tap: { scale: 0.95 },
  };

  return (
    <div className="max-w-3xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-2xl shadow-lg p-6 md:p-8"
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Join Nexus Academy</h2>
          <p className="text-gray-600">Create your account to get started with learning</p>
        </div>

        {submitStatus && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 p-4 rounded-xl flex items-center ${
              submitStatus.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}
          >
            {submitStatus.success ? (
              <Check className="mr-2 h-5 w-5 text-green-500" />
            ) : (
              <AlertCircle className="mr-2 h-5 w-5 text-red-500" />
            )}
            <span>{submitStatus.message}</span>
          </motion.div>
        )}

        <form onSubmit={formik.handleSubmit}>
          <motion.div
            variants={formVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            {formFields.map((field) => (
              <motion.div key={field.name} variants={fieldVariants} className="space-y-1">
                <label
                  htmlFor={field.name}
                  className="block text-sm font-medium text-gray-700"
                >
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                
                {renderField(field)}
                
                {formik.touched[field.name] && formik.errors[field.name] && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="text-red-500 text-sm mt-1 flex items-center"
                    id={`${field.name}-error`}
                  >
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {formik.errors[field.name]}
                  </motion.div>
                )}
              </motion.div>
            ))}

            <motion.div
              variants={fieldVariants}
              className="mt-8"
            >
              <motion.button
                type="submit"
                disabled={isLoading || !formik.isValid}
                variants={buttonVariants}
                initial="rest"
                whileHover="hover"
                whileTap="tap"
                className={`w-full flex items-center justify-center py-3 px-6 rounded-2xl text-white font-bold text-xl shadow-md ${
                  isLoading || !formik.isValid
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
                } transition-all duration-300`}
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-6 w-6" />
                    Register
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </motion.button>
            </motion.div>
          </motion.div>
        </form>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="mt-6 text-center"
        >
          <p className="text-gray-600">
            Already have an account?{' '}
            <a
              href="/login"
              className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
            >
              Log in
            </a>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default StudentRegistration; 