interface Status {
  valid: boolean
  message?: string
}

type Rule = (value: string) => Status

export function required(value: string): Status {
  const result = Boolean(value)

  return {
    valid: result,
    message: result ? undefined : 'This field is required'
  }
}

export function validate (value: string, rules: Rule[]): Status {
  for (const rule of rules) {
    const result = rule(value)
    if (!result.valid) {
      return result
    }
  }

  return {
    valid: true
  }
}

console.log(
  validate('', [required]),
  validate('username', [required])
)