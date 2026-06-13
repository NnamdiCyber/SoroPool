import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ async: false })
export class MaxPriceImpactConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments): boolean {
    if (typeof value !== 'number') return false;
    const [max] = args.constraints as number[];
    return value <= max;
  }

  defaultMessage(args: ValidationArguments): string {
    const [max] = args.constraints as number[];
    return `${args.property} must not exceed ${max}`;
  }
}

export function MaxPriceImpact(max: number, validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [max],
      validator: MaxPriceImpactConstraint,
    });
  };
}
