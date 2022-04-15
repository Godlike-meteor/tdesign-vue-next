import { computed, defineComponent, ref, VNode, watch } from 'vue';
import { AddIcon, RemoveIcon, ChevronDownIcon, ChevronUpIcon } from 'tdesign-icons-vue-next';
import TButton from '../button';
import TInput from '../input';
import CLASSNAMES from '../utils/classnames';
import props from './props';
import { ChangeSource, TdInputNumberProps } from './type';
import { ClassName } from '../common';
import { emitEvent } from '../utils/event';

// hooks
import { useFormDisabled } from '../form/hooks';
import { usePrefixClass } from '../hooks/useConfig';
import { useEmitEvent } from '../hooks/event';
import useInputAction from './useInputAction';
import useInputNumberStep from './useInputNumberStep';
import useInputNumberTools from './useInputNumberTools';
import useKeyboardEvents from './useKeyboardEvents';

type InputNumberEvent = {
  onInput?: (e: InputEvent) => void;
  onClick?: (e: MouseEvent) => void;
  onBlur?: (e: FocusEvent) => void;
  onFocus?: (e: FocusEvent) => void;
  onKeydown?: (e: KeyboardEvent) => void;
  onKeyup?: (e: KeyboardEvent) => void;
  onKeypress?: (e: KeyboardEvent) => void;
};

type ChangeContextEvent = InputEvent | MouseEvent | FocusEvent;

type InputNumberAttr = {
  disabled?: boolean;
  readonly?: any;
  autocomplete?: string;
  ref: string;
  placeholder: string;
  unselectable?: string;
  tips: TdInputNumberProps['tips'];
  autoWidth: boolean;
  align: TdInputNumberProps['align'];
  status: TdInputNumberProps['status'];
};

export default defineComponent({
  name: 'TInputNumber',
  components: {
    AddIcon,
    RemoveIcon,
    ChevronDownIcon,
    ChevronUpIcon,
    TButton,
    TInput,
  },
  props,
  emits: ['update:value', 'change', 'blur', 'focus', 'keydown-enter', 'keydown', 'keyup', 'keypress'],
  setup(props) {
    const disabled = useFormDisabled();
    const COMPONENT_NAME = usePrefixClass('input-number');
    const classPrefix = usePrefixClass();
    const emitEvent = useEmitEvent();

    const isError = ref(false);
    const inputting = ref(false);

    const { digitsNum, filterValue, clearFilterValue, addClasses, reduceClasses, ...stepHandler } = useInputNumberStep(
      COMPONENT_NAME,
      props,
      isError,
    );
    const inputNumberTools = useInputNumberTools(props, digitsNum, isError);
    const { innerValue, handleAction, userInput } = useInputAction(props, digitsNum);
    const keyboardEvents = useKeyboardEvents(innerValue);

    const handleStartInput = () => {
      inputting.value = true;
      if (innerValue === undefined) return;
      filterValue.value = innerValue.value.toFixed(digitsNum.value);
    };

    const handleEndInput = (e: FocusEvent) => {
      inputting.value = false;
      const value = inputNumberTools.toValidNumber(filterValue.value);
      if (value !== innerValue.value) {
        handleAction(value, 'input', e);
      }
      isError.value = false;
    };

    const handleBlur = async (e: FocusEvent) => {
      await handleEndInput(e);
      clearFilterValue();
      emitEvent('blur', innerValue.value, { e });
    };

    const handleFocus = (e: FocusEvent) => {
      handleStartInput();
      emitEvent('focus', innerValue.value, { e });
    };

    const handleInput = (val: string, e: InputEvent) => {
      userInput.value = val;
      filterValue.value = inputNumberTools.toValidStringNumber(userInput.value);
      userInput.value = '';
      if (!inputNumberTools.isValid(filterValue.value) || Number(filterValue.value) === innerValue.value) return;
      handleAction(Number(filterValue.value), 'input', e);
    };

    const computeds = {
      reduceEvents: computed(() => ({ onClick: stepHandler.handleReduce })),
      addEvents: computed(() => ({ onClick: stepHandler.handleAdd })),
      cmptWrapClasses: computed(() => [
        COMPONENT_NAME.value,
        COMPONENT_NAME.value[props.size],
        {
          [COMPONENT_NAME.value.disabled]: props.disabled,
          [`${classPrefix.value}-is-controls-right`]: props.theme === 'column',
          [`${COMPONENT_NAME.value}--${props.theme}`]: props.theme,
          [`${COMPONENT_NAME.value}--auto-width`]: props.autoWidth,
        },
      ]),
      inputEvents: computed(() => ({
        onBlur: handleBlur,
        onFocus: handleFocus,
        onKeydown: keyboardEvents.handleKeydown,
        onKeyup: keyboardEvents.handleKeyup,
        onKeypress: keyboardEvents.handleKeypress,
      })),
      inputAttrs: computed(() => ({
        disabled: props.disabled,
        readonly: props.readonly,
        autocomplete: 'off',
        ref: 'refInputElem',
        placeholder: props.placeholder,
        unselectable: props.readonly ? 'on' : 'off',
        tips: props.tips,
        autoWidth: props.autoWidth,
        align: props.align || (props.theme === 'row' ? 'center' : undefined),
        status: isError.value ? 'error' : props.status,
      })),
      decreaseIcon: computed(() =>
        props.theme === 'column' ? <chevron-down-icon size={props.size} /> : <remove-icon size={props.size} />,
      ),
      increaseIcon: computed(() =>
        props.theme === 'column' ? <chevron-up-icon size={props.size} /> : <add-icon size={props.size} />,
      ),
      displayValue: computed(() => {
        if (inputting.value && userInput.value !== null) {
          return filterValue.value;
        }
        if ([undefined, null].includes(innerValue.value)) return '';
        // end input
        return props.format && !inputting.value
          ? props.format(innerValue.value)
          : innerValue.value.toFixed(digitsNum.value);
      }),
    };

    watch(
      innerValue,
      (v) => {
        if (v !== undefined) {
          inputNumberTools.isValidNumber(v);
        }
      },
      { immediate: true },
    );

    return {
      classPrefix,
      COMPONENT_NAME,
      disabled,
      ...computeds,
      handleInput,
      addClasses,
      reduceClasses,
    };
  },
  render() {
    return (
      <div class={this.cmptWrapClasses}>
        {this.theme !== 'normal' && (
          <t-button
            class={this.reduceClasses}
            {...this.reduceEvents}
            variant="outline"
            shape="square"
            v-slots={{
              icon: () => this.decreaseIcon,
            }}
          />
        )}

        <t-input
          {...this.inputAttrs}
          {...this.inputEvents}
          value={this.displayValue}
          onChange={(val: string, { e }: { e: InputEvent }) => this.handleInput(val, e)}
        />
        {this.theme !== 'normal' && (
          <t-button
            class={this.addClasses}
            {...this.addEvents}
            variant="outline"
            shape="square"
            v-slots={{
              icon: () => this.increaseIcon,
            }}
          />
        )}
      </div>
    );
  },
});
