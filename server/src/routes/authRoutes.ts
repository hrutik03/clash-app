import { Router, Request, Response } from "express";
import { loginSchema, registerSchema } from "../validation/authValidations.js";
import { ZodError } from "zod";
import { formatError, renderEmailEjs } from "../helper.js";
import prisma from "../config/database.js";
import bcrypt from "bcrypt";
import { v4 as uuid4 } from "uuid";
import { emailQueue, emailQueueName } from "../jobs/EmailJob.js";
import jwt from "jsonwebtoken";

const router = Router();

router.post("/login", async (req: Request, res: Response) => {
  try {
    const body = req.body;
    const payload = loginSchema.parse(body);
    let user = await prisma.user.findUnique({
      where: {
        email: payload.email,
      },
    });
    if (!user || user === null) {
      return res.status(422).json({
        errors: {
          email: "No User found with this email.",
        },
      });
    }

    // check password
    const compare = await bcrypt.compare(payload.password, user.password);
    if (!compare) {
      return res.status(422).json({
        errors: {
          password: "Password did not matched",
        },
      });
    }

    let JWTPayload = {
      id: user.id,
      name: user.name,
      email: user.email,
    };

    const token = jwt.sign(JWTPayload, process.env.SECRET_KEY!, {
      expiresIn: "60d",
    });

    return res.json({
      message: "Login Success",
      data: {
        ...JWTPayload,
        token: `Bearer ${token}`,
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      const errors = formatError(error);
      return res.status(422).json({
        message: "Validation Error",
        errors,
      });
    }

    console.log(error);

    return res.status(500).json({
      message: "Something went wrong",
      error: error,
    });
  }
});

router.post("/register", async (req: Request, res: Response) => {
  try {
    const body = req.body;
    const payload = registerSchema.parse(body);
    let user = await prisma.user.findUnique({
      where: {
        email: payload.email,
      },
    });
    if (user) {
      return res.status(422).json({
        errors: {
          email: "Email already exists",
        },
      });
    }

    const salt = await bcrypt.genSalt(10);
    payload.password = await bcrypt.hash(payload.password, salt);
    const token = await bcrypt.hash(uuid4(), salt);
    const url = `${process.env.APP_URL}/email-verify?email=${payload.email}&token=${token}`;
    const emailBody = await renderEmailEjs("email-verify", {
      name: payload.name,
      url: url,
    });

    await emailQueue.add(emailQueueName, {
      to: payload.email,
      subject: "Clash Email Verification",
      body: emailBody,
    });

    await prisma.user.create({
      data: {
        name: payload.name,
        email: payload.email,
        password: payload.password,
        email_verify_token: token,
      },
    });

    return res.json({
      message:
        "Please check your email we have send you email verification link",
    });
  } catch (error) {
    if (error instanceof ZodError) {
      const errors = formatError(error);
      return res.status(422).json({
        message: "Validation Error",
        errors,
      });
    }

    console.log(error);

    return res.status(500).json({
      message: "Something went wrong",
      error: error,
    });
  }
});

export default router;
