import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ async: false })
export class MinSlippageConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments): boolean {
    if (typeof value !== 'number') return false;
    const [min] = args.constraints as number[];
    return value >= min;
  }

  defaultMessage(args: ValidationArguments): string {
    const [min] = args.constraints as number[];
    return `${args.property} must be at least ${min}`;
  }
}

export function MinSlippage(min: number, validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [min],
      validator: MinSlippageConstraint,
    });
  };
}
