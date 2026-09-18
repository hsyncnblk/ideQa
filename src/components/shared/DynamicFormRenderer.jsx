/**
 * @module components/shared/DynamicFormRenderer
 *
 * Schema-driven form renderer.
 * Reads field definitions from formSchemas and renders the appropriate
 * input types (text, textarea, dropdown) dynamically.
 * Adding a new form field = adding 1 line to the schema file.
 */

import React from 'react';
import { OPTIONS_REGISTRY } from '../../schemas/dropdownOptions';

/**
 * Renders a single form field based on its schema definition.
 * @param {object} props
 * @param {object} props.field - Field definition from schema
 * @param {*} props.value - Current field value
 * @param {Function} props.onChange - Called with (fieldKey, newValue)
 * @param {string} [props.error] - Validation error message
 * @param {object} [props.sectionData] - Full section data (for dependsOn checks)
 */
function FormField({ field, value, onChange, error, sectionData = {} }) {
  const { key, label, type, placeholder, maxLength, rows, optionsKey, dependsOn } = field;

  // Handle conditional visibility
  if (dependsOn) {
    const depValue = sectionData[dependsOn.field];
    if (depValue !== dependsOn.value) return null;
  }

  const baseInputClass = `w-full px-3 py-2 text-sm border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-jira-400/30 focus:border-jira-500 ${error ? 'border-red-400 bg-red-50/30' : 'border-slate-300 bg-white hover:border-slate-400'
    }`;

  return (
    <div className="space-y-1">
      <label className="block text-xs font-semibold text-slate-600">
        {label}
        {field.required && <span className="text-red-500 ml-0.5">*</span>}
      </label>

      {type === 'text' && (
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(key, e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          className={baseInputClass}
        />
      )}

      {type === 'textarea' && (
        <div className="relative">
          <textarea
            value={value || ''}
            onChange={(e) => onChange(key, e.target.value)}
            placeholder={placeholder}
            maxLength={maxLength}
            rows={rows || 3}
            className={`${baseInputClass} resize-none`}
          />
          {maxLength && (
            <span className="absolute bottom-1.5 right-2 text-[10px] text-slate-400">
              {(value || '').length}/{maxLength}
            </span>
          )}
        </div>
      )}

      {type === 'dropdown' && (
        <select
          value={value || ''}
          onChange={(e) => onChange(key, e.target.value)}
          className={`${baseInputClass} cursor-pointer`}
        >
          {optionsKey && OPTIONS_REGISTRY[optionsKey]?.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      )}

      {type === 'number' && (
        <input
          type="number"
          value={value || ''}
          onChange={(e) => onChange(key, e.target.value)}
          placeholder={placeholder}
          className={baseInputClass}
        />
      )}

      {error && (
        <p className="text-xs text-red-500 mt-0.5">{error}</p>
      )}
    </div>
  );
}

/**
 * Renders all fields of a single form section.
 * @param {object} props
 * @param {object} props.sectionSchema - Section definition from formSchemas
 * @param {object} props.sectionData - Current data for this section
 * @param {Function} props.onChange - Called with (sectionKey, fieldKey, newValue)
 * @param {object} [props.errors] - { fieldKey: errorMessage } map for this section
 */
function FormSection({ sectionSchema, sectionData = {}, onChange, errors = {} }) {
  return (
    <div className="space-y-3">
      {sectionSchema.fields.map((field) => (
        <FormField
          key={field.key}
          field={field}
          value={sectionData[field.key]}
          onChange={(fieldKey, val) => onChange(sectionSchema.key, fieldKey, val)}
          error={errors[field.key]}
          sectionData={sectionData}
        />
      ))}
    </div>
  );
}

/**
 * Main dynamic form renderer.
 * Renders a tabbed or sequential form based on schema sections.
 *
 * @param {object} props
 * @param {object} props.schema - Full form schema (with sections array)
 * @param {object} props.formData - Full form data keyed by section key
 * @param {Function} props.onChange - Called with (sectionKey, fieldKey, newValue)
 * @param {string} [props.activeSection] - Currently active section key (for tabbed mode)
 * @param {object} [props.sectionErrors] - { sectionKey: { fieldKey: errorMessage } }
 */
export default function DynamicFormRenderer({
  schema,
  formData = {},
  onChange,
  activeSection,
  sectionErrors = {},
}) {
  if (!schema || !schema.sections) return null;

  const sectionsToRender = activeSection
    ? schema.sections.filter((s) => s.key === activeSection)
    : schema.sections;

  return (
    <div className="space-y-6">
      {sectionsToRender.map((section) => (
        <div key={section.key}>
          {!activeSection && (
            <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-1.5">
              {section.label}
            </h4>
          )}
          <FormSection
            sectionSchema={section}
            sectionData={formData[section.key] || {}}
            onChange={onChange}
            errors={sectionErrors[section.key] || {}}
          />
        </div>
      ))}
    </div>
  );
}
