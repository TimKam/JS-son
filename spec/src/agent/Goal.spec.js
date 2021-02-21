const Goal = require('../../../src/agent/Goal')

const warning = 'JS-son: Created goal with non-JSON object, non-JSON data type value';

describe('goal()', () => {
  console.warn = jasmine.createSpy('warn')

  it('should create a new goal with the specified id, activeness status, and value', () => {
    expect(Goal('test', false)).toEqual({ id: 'test', isActive: false })
    expect(Goal('test', true, { intensity: 1 })).toEqual(
      { id: 'test', isActive: true, value: { intensity: 1 } }
    )
  })

  it('should not throw a warning if goal value is of a JSON data type', () => {
    console.warn.calls.reset()
    // eslint-disable-next-line no-unused-vars
    const goals = {
      ...Goal('number', true, 1),
      ...Goal('string', true, 'string'),
      ...Goal('null', true, null),
      ...Goal('array', true, [])
    }
    expect(console.warn).not.toHaveBeenCalledWith(warning)
  })

  it('should not throw warning if goal is JSON.stringify-able', () => {
    console.warn.calls.reset()
    // eslint-disable-next-line no-unused-vars
    const goal = Goal('object', true, {})
    expect(console.warn).not.toHaveBeenCalledWith(warning)
  })

  it('should throw warning if goal isn\'t JSON.stringify-able & not of a JSON data type', () => {
    console.warn.calls.reset()
    // eslint-disable-next-line no-unused-vars
    const goal = Goal('function', true, () => {})
    expect(console.warn).toHaveBeenCalledWith(warning)
  })
})
