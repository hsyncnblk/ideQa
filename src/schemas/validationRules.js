/**
 * @module schemas/validationRules
 *
 * Generic, schema-driven form validation.
 * Reads field definitions from formSchemas and returns structured error objects.
 */

import { OPTIONS_REGISTRY } from './dropdownOptions';

/**
 * Validates a single field value against its schema definition.
 * @param {object} fieldDef - Field definition from formSchemas
 * @param {*} value - Current field value
 * @returns {string|null} Error message or null if valid
 */
export function validateField(fieldDef, value) {
  const { key, label, required, maxLength, type, optionsKey } = fieldDef;

  // Required check
  if (required) {
    if (value === undefined || value === null || (typeof value === 'string' && !value.trim())) {
      return `${label} alanı zorunludur.`;
    }
  }

  // Skip further checks if empty and not required
  if (!value || (typeof value === 'string' && !value.trim())) {
    return null;
  }

  // Max length check
  if (maxLength && typeof value === 'string' && value.length > maxLength) {
    return `${label} alanı en fazla ${maxLength} karakter olabilir.`;
  }

  // Dropdown value validity check
  if (type === 'dropdown' && optionsKey) {
    const validOptions = OPTIONS_REGISTRY[optionsKey];
    if (validOptions && !validOptions.includes(value)) {
      return `${label} alanında geçersiz bir değer seçildi.`;
    }
  }

  return null;
}

/**
 * Validates an entire form section against its schema.
 * @param {object} sectionSchema - Section from formSchemas (contains fields array)
 * @param {object} sectionData - Current form data for this section
 * @returns {{ isValid: boolean, errors: object }} errors is a { fieldKey: errorMessage } map
 */
export function validateSection(sectionSchema, sectionData = {}) {
  const errors = {};

  for (const fieldDef of sectionSchema.fields) {
    // Handle conditional visibility (dependsOn)
    if (fieldDef.dependsOn) {
      const { field: depField, value: depValue } = fieldDef.dependsOn;
      if (sectionData[depField] !== depValue) {
        continue; // Skip validation for hidden fields
      }
    }

    const value = sectionData[fieldDef.key];
    const error = validateField(fieldDef, value);
    if (error) {
      errors[fieldDef.key] = error;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validates an entire multi-section form against its schema.
 * @param {object} formSchema - Full form schema (has sections array)
 * @param {object} formData - Full form data keyed by section key
 * @returns {{ isValid: boolean, sectionErrors: object }}
 */
export function validateForm(formSchema, formData = {}) {
  const sectionErrors = {};
  let isValid = true;

  for (const section of formSchema.sections) {
    const result = validateSection(section, formData[section.key] || {});
    if (!result.isValid) {
      isValid = false;
      sectionErrors[section.key] = result.errors;
    }
  }

  return { isValid, sectionErrors };
}

/**
 * Simple single-field validations for non-schema forms.
 */
export const simpleValidators = {
  /** Validates a Jira story key (e.g., SCRUM-5, MP-123) */
  storyKey(value) {
    const clean = (value || '').trim().toUpperCase();
    if (!clean) return 'Lütfen geçerli bir Jira Story No girin (Örn: PROJ-123)';
    if (!clean.includes('-')) return 'Story numarası proje kodu içermelidir (Örn: SCRUM-5).';
    return null;
  },

  /** Validates that notes/description is not empty */
  requiredText(value, label = 'Bu alan') {
    if (!value || !(value.trim())) return `${label} zorunludur.`;
    return null;
  },

  /** Validates at least one platform is selected */
  platformSelection(platforms) {
    if (!platforms || platforms.length === 0) return 'Lütfen en az bir platform seçin.';
    return null;
  },
};
