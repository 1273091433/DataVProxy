"use strict"
var ready = require('ready');
var mysql = require('mysql');

class Mysql {
  constructor(config) {
    var self = this;
    this.api = config.name;
    this.conn = mysql.createPool({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database,
      multipleStatements: true,
      supportBigNumbers: true,
      connectTimeout: 30000,
    });

    this.db = config.database;
    this.connectCount = 0;

    this.conn.config.connectionConfig.queryFormat = function (query, values) {
      if (!values) return query;
      var sql = query.replace(/\:(\w+)/g, function (txt, key) {
        if ( Object.prototype.hasOwnProperty.call(values, key) ) {
          var value = values[key];
          return this.escape(value);
        }
        return txt;
      }.bind(this));
      return sql;
    };

    ready(this);
    this.ready(true);
  }

  test() {
    var self = this;
    return function(cb) {
      self.conn.query('show tables', function(err, data){
        if(err) cb(null,err);
        else cb(null,'connected');
      })
    }
  }

  query(sql, values) {
    var self = this;
    return function(cb){
      self.ready(function(){
        if (typeof values === 'function') {
          cb = values;
          values = null;
        }
        self.conn.query({sql:sql, timeout:30000}, values, function (err, rows) {
          err && console.log(sql, values, err)
          cb && cb(err&&err.code, rows);
        });
      });
    }
  }

  end(){
    this.conn.end();
  }

  testConnection() {
    var self = this;
    return function(cb){
      self.conn.getConnection(function(err, connection){
        if (err)  {
          var msg = err.toString()
          if (msg.match('ER_BAD_DB_ERROR')) {
            cb("未找到数据库："+self.db);
          } else {
            cb(msg);
          }
        } else {
          connection.release();
          cb(null, '连接成功');
        }
      })
    }
  }
}

module.exports = Mysql
