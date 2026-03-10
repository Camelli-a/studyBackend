const express = require('express');
const router = express.Router();
const crypto = require('crypto');

// 引入你封装的 db 对象（假设你的路由文件在 routes 目录下，dbUtils 在 db 目录下）
const { db } = require("../db/dbUtils");

/**
 * @api {post} /api/v1/simple_admin/register 简单注册账号（原生 SQL 版）
 */
router.post('/register', async (req, res) => {
    let { account, password } = req.body;

    // 1. 参数合法性校验
    if (!account || !password) {
        return res.status(400).send({
            code: 400,
            error: "账号或密码不能为空"
        });
    }

    try {
        // 2. 检查账号是否已存在 (使用 db.async.all 查询多条/单条数据)
        const checkSql = "SELECT account FROM admin WHERE account = ?";
        const { rows: existRows } = await db.async.all(checkSql, [account]);

        if (existRows.length > 0) {
            return res.status(409).send({
                code: 409,
                error: "该账号已被注册"
            });
        }

        // 3. 对密码进行 SHA256 加密
        const hash = crypto.createHash('sha256');
        hash.update(password);
        const hashpwd = hash.digest('hex');

        // 4. 将新账号插入数据库 (使用 db.async.run 执行 INSERT 操作)
        const insertSql = "INSERT INTO admin (account, password) VALUES (?, ?)";
        await db.async.run(insertSql, [account, hashpwd]);

        res.status(200).send({
            code: 200,
            msg: "注册成功"
        });

    } catch (err) {
        console.error("Register DB Error:", err);
        res.status(500).send({
            code: 500,
            error: "服务器内部错误"
        });
    }
});

/**
 * @api {post} /api/v1/simple_admin/login 简单登录账号（原生 SQL 版）
 */
router.post('/login', async (req, res) => {
    let { account, password } = req.body;

    // 1. 参数合法性校验
    if (!account || !password) {
        return res.status(400).send({
            code: 400,
            error: "账号或密码不能为空"
        });
    }

    // 2. 对输入的密码进行 SHA256 加密，以便与数据库比对
    const hash = crypto.createHash('sha256');
    hash.update(password);
    const hashpwd = hash.digest('hex');

    try {
        // 3. 在数据库中查找匹配的账号和密码 (避免查出密码，只 select account)
        const loginSql = "SELECT account FROM admin WHERE account = ? AND password = ?";
        const { rows: loginRows } = await db.async.all(loginSql, [account, hashpwd]);

        // 4. 判断是否找到用户
        if (loginRows.length > 0) {
            // 登录成功：获取第一条记录的 account
            res.status(200).send({
                code: 200,
                msg: "登录成功",
                data: {
                    account: loginRows[0].account
                }
            });
        } else {
            // 登录失败：账号或密码不匹配
            res.status(401).send({
                code: 401,
                error: "账号或密码错误"
            });
        }

    } catch (err) {
        console.error("Login DB Error:", err);
        res.status(500).send({
            code: 500,
            error: "服务器内部错误"
        });
    }
});

module.exports = router;