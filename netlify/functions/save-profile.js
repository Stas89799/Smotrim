const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');
const Busboy = require('busboy');

const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_KEY
    }
});

exports.handler = async (event, context) => {
    const user = context.clientContext.user;
    if (!user) return { statusCode: 401, body: 'Unauthorized' };

    try {
        const busboy = Busboy({ headers: event.headers });
        const fields = {};
        const files = [];

        await new Promise((resolve, reject) => {
            busboy.on('file', (name, file, info) => {
                const chunks = [];
                file.on('data', (data) => chunks.push(data));
                file.on('end', () => {
                    files.push({
                        name: info.filename,
                        data: Buffer.concat(chunks),
                        type: info.mimeType
                    });
                });
            });

            busboy.on('field', (name, value) => {
                fields[name] = value;
            });

            busboy.on('finish', resolve);
            busboy.on('error', reject);
            
            busboy.write(event.body, 'base64');
            busboy.end();
        });

        // Сохранение аватара в S3
        let avatarUrl = fields.avatar || '';
        if (files.length > 0) {
            const file = files[0];
            const key = `avatars/${user.sub}/${uuidv4()}-${file.name}`;
            
            await s3.send(new PutObjectCommand({
                Bucket: process.env.S3_BUCKET,
                Key: key,
                Body: file.data,
                ContentType: file.type,
                ACL: 'public-read'
            }));
            
            avatarUrl = `https://${process.env.S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
        }

        // Здесь добавьте сохранение в вашу БД
        const profileData = {
            ...fields,
            avatar: avatarUrl,
            userId: user.sub
        };

        return {
            statusCode: 200,
            body: JSON.stringify({ 
                success: true, 
                avatarUrl,
                message: 'Профиль успешно сохранен'
            })
        };

    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};