const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: false,
  }
);

const db = {};

db.sequelize = sequelize;
db.Sequelize = Sequelize;

const modelsDir = path.join(__dirname, 'models');
fs.readdirSync(modelsDir)
    .filter(file => file.endsWith('.js')) // 只处理 .js 文件
    .forEach(file => {
        // 引入模型定义函数
        const modelDefinition = require(path.join(modelsDir, file));
        // 调用模型定义函数，传入 sequelize 实例和 DataTypes
        const model = modelDefinition(sequelize, DataTypes);
        // 将初始化的模型以大写驼峰命名存入 db 对象 (e.g., db.StationSchedule)
        db[model.name] = model;
    });
module.exports = sequelize;
