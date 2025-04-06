exports.handler = async (event, context) => {
    const user = context.clientContext.user;
    if (!user) return { statusCode: 401, body: 'Unauthorized' };

    try {
        // Здесь реализуйте запрос к вашей БД
        const mockProfile = {
            firstName: 'Иван',
            lastName: 'Иванов',
            email: user.email,
            avatar: 'https://example.com/avatar.jpg'
        };

        return {
            statusCode: 200,
            body: JSON.stringify(mockProfile)
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};