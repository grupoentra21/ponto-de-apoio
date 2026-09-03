'use client';

type CrpNumberInputProps = {
  defaultValue: string;
  disabled: boolean;
};

export function CrpNumberInput({
  defaultValue,
  disabled,
}: CrpNumberInputProps) {
  return (
    <input
      name="registrationNumber"
      required
      defaultValue={defaultValue}
      disabled={disabled}
      placeholder="123456"
      inputMode="numeric"
      pattern="[0-9]*"
      onInput={(event) => {
        event.currentTarget.value = event.currentTarget.value.replace(/\D/g, '');
      }}
    />
  );
}
