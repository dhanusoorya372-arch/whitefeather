const express = require('express');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
const preferredPort = Number(process.env.PORT || 3000);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

const requiredEnv = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'CONTACT_TO'];

const getMissingEnv = () => requiredEnv.filter((key) => !process.env[key]);

app.post('/api/contact', async (req, res) => {
    const { name, email, company, message } = req.body || {};

    if (!name || !email || !message) {
        return res.status(400).json({ success: false, message: 'Name, email, and message are required.' });
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
        return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
    }

    const missingEnv = getMissingEnv();
    if (missingEnv.length) {
        return res.status(500).json({
            success: false,
            message: 'Email configuration is incomplete. Add real SMTP values to .env before sending live email.'
        });
    }

    try {
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT),
            secure: Number(process.env.SMTP_PORT) === 465,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        await transporter.sendMail({
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to: process.env.CONTACT_TO,
            replyTo: email,
            subject: `New inquiry from ${name}`,
            text: `Name: ${name}\nEmail: ${email}\nCompany: ${company || 'Not provided'}\n\nMessage:\n${message}`,
            html: `
                <h3>New inquiry</h3>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Company:</strong> ${company || 'Not provided'}</p>
                <p><strong>Message:</strong></p>
                <p>${String(message).replace(/\n/g, '<br>')}</p>
            `
        });

        return res.json({ success: true, message: 'Your inquiry has been sent successfully.' });
    } catch (error) {
        console.error('Email send failed:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to send the message. Please try again later.'
        });
    }
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const startServer = (port) => {
    const server = app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });

    server.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
            const fallbackPort = port + 1;
            console.log(`Port ${port} is busy. Retrying on ${fallbackPort}...`);
            startServer(fallbackPort);
            return;
        }

        throw error;
    });
};

startServer(preferredPort);
