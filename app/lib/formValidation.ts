export const FRIENDLY_SUBMISSION_ERROR_MESSAGE =
  "We couldn't submit your request right now. Please try again in a moment."

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export interface RfdFormData {
  company: string
  contactPerson: string
  email: string
  phone: string
  budget: string
  products: string[]
  message: string
}

export interface RfdFormErrors {
  company?: string
  contactPerson?: string
  email?: string
  phone?: string
  budget?: string
  products?: string
  message?: string
}

export interface ContactFormData {
  name: string
  email: string
  company: string
  phone: string
  budget: string
  subject: string
  message: string
}

export interface ContactFormErrors {
  name?: string
  email?: string
  company?: string
  phone?: string
  budget?: string
  subject?: string
  message?: string
}

export function isValidEmail(email: string): boolean {
  return EMAIL_PATTERN.test(email.trim())
}

export function validateRfdForm(formData: RfdFormData): RfdFormErrors {
  const errors: RfdFormErrors = {}

  if (!formData.company.trim()) {
    errors.company = "Company name is required"
  }

  if (!formData.contactPerson.trim()) {
    errors.contactPerson = "Contact person is required"
  }

  if (!formData.email.trim()) {
    errors.email = "Email is required"
  } else if (!isValidEmail(formData.email)) {
    errors.email = "Please enter a valid email address"
  }

  if (!formData.phone.trim()) {
    errors.phone = "Phone is required"
  }

  if (!formData.budget) {
    errors.budget = "Budget range is required"
  }

  if (formData.products.length === 0) {
    errors.products = "Please select at least one product"
  }

  return errors
}

export function validateContactForm(formData: ContactFormData): ContactFormErrors {
  const errors: ContactFormErrors = {}

  if (!formData.name.trim()) {
    errors.name = "Name is required"
  }

  if (!formData.email.trim()) {
    errors.email = "Email is required"
  } else if (!isValidEmail(formData.email)) {
    errors.email = "Please enter a valid email address"
  }

  if (!formData.company.trim()) {
    errors.company = "Company name is required"
  }

  if (!formData.phone.trim()) {
    errors.phone = "Phone is required"
  }

  if (!formData.budget) {
    errors.budget = "Budget range is required"
  }

  if (!formData.subject.trim()) {
    errors.subject = "Subject is required"
  }

  if (!formData.message.trim()) {
    errors.message = "Message is required"
  }

  return errors
}
