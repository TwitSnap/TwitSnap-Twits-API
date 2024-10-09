export const registerUserDoc = {
            in: 'body',
            description: 'Register new user',
            required: true,
            schema: {
                data: {
                    id: "uuid",
                    password: "1234"
                }
            }
};

export const loginDoc = {
    parameters: {
        body: {
            in: 'body',
            description: 'User login credentials.',
            required: true,
            schema: {
                data: {
                    email: "user",
                    password: "1234"
                }
            }
        }


        
    },
    responses: {
        202: {
            description: 'Successful Login',
            schema: {
                data: {
                    token: "unToken",
                }
            }
        }
    }
};