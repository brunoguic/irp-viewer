export const EPS = 0.0001

export function isEquals(left, right) {
    return Math.abs(left - right) < EPS;
}