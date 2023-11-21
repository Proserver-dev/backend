const validatePassword = (password) => {
    const lowercaseCount = (password.match(/[a-z]/g) || []).length;
    const uppercaseCount = (password.match(/[A-Z]/g) || []).length;
    const digitsCount = (password.match(/\d/g) || []).length;
    const specialCharCount = (password.match(/[!@#$%^&*(),.?":{}|<>]/g) || []).length;

    return {
        lowercaseCount,
        uppercaseCount,
        digitsCount,
        specialCharCount
    }
}

module.exports = validatePassword