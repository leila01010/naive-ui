import { h, defineComponent, PropType, provide, ExtractPropTypes } from 'vue'
import { ErrorList } from 'async-validator'
import { useTheme } from '../../_mixins'
import type { ThemeProps } from '../../_mixins'
import { formLight } from '../styles'
import type { FormTheme } from '../styles'
import style from './styles/form.cssr'
import {
  ApplyRule,
  FormInjection,
  FormItemRef,
  FormRules,
  FormValidateCallback,
  LabelAlign,
  LabelPlacement
} from './interface'
import { keysOf } from '../../_utils'

const formProps = {
  ...(useTheme.props as ThemeProps<FormTheme>),
  inline: {
    type: Boolean,
    default: false
  },
  labelWidth: [Number, String] as PropType<number | string>,
  labelAlign: {
    type: String as PropType<LabelAlign>,
    default: 'left'
  },
  labelPlacement: {
    type: String as PropType<LabelPlacement>,
    default: 'top'
  },
  model: {
    type: Object as PropType<Record<string, any>>,
    default: () => {}
  },
  rules: Object as PropType<FormRules>,
  size: String as PropType<'small' | 'medium' | 'large'>,
  showRequireMark: {
    type: Boolean as PropType<boolean | undefined>,
    default: undefined
  },
  showFeedback: {
    type: Boolean,
    default: true
  },
  onSubmit: {
    type: Function as PropType<(e: Event) => void>,
    default: (e: Event) => e.preventDefault()
  }
} as const

export type FormProps = ExtractPropTypes<typeof formProps>

export default defineComponent({
  name: 'Form',
  props: formProps,
  setup (props) {
    useTheme('Form', 'Form', style, formLight, props)
    // from path to form-item
    const formItems: Record<string, FormItemRef[]> = {}
    async function validate (
      validateCallback?: FormValidateCallback,
      shouldRuleBeApplied: ApplyRule = () => true
    ): Promise<void> {
      return new Promise((resolve, reject) => {
        const formItemValidationPromises = []
        for (const key of keysOf(formItems)) {
          const formItemInstances = formItems[key]
          for (const formItemInstance of formItemInstances) {
            if (formItemInstance.path) {
              formItemValidationPromises.push(
                formItemInstance.internalValidate(null, shouldRuleBeApplied)
              )
            }
          }
        }
        void Promise.all(formItemValidationPromises).then((results) => {
          if (results.some((result) => !result.valid)) {
            const errors = results
              .filter((result) => result.errors)
              .map((result) => result.errors)
            if (validateCallback) {
              validateCallback(errors as ErrorList[])
            } else {
              reject(errors)
            }
          } else {
            if (validateCallback) validateCallback()
            else {
              resolve()
            }
          }
        })
      })
    }
    function restoreValidation (): void {
      for (const key of keysOf(formItems)) {
        const formItemInstances = formItems[key]
        for (const formItemInstance of formItemInstances) {
          formItemInstance.restoreValidation()
        }
      }
    }
    provide<FormInjection>('NForm', props)
    provide('NFormRules', { formItems })
    return {
      validate,
      restoreValidation
    }
  },
  render () {
    return (
      <form
        class={[
          'n-form',
          {
            'n-form--inline': this.inline
          }
        ]}
        onSubmit={this.onSubmit}
      >
        {this.$slots}
      </form>
    )
  }
})
