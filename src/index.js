const mysql=require('mysql');
const express=require('express');
const bodyparser=require('body-parser');
const moment = require('moment-timezone');
const multer = require('multer');
const fs = require('fs');
const cors = require('cors');
const uuidv4 = require('uuid/v4');
const session = require('express-session');
var sha1 = require('sha1');


var app=express();

// 查看 HTTP HEADER 的 Content-Type: application/x-www-form-urlencoded
app.use(bodyparser.urlencoded({extended: false}));

// 查看 HTTP HEADER 的 Content-Type: application/json
app.use(bodyparser.json());


var whitelist = ['http://localhost:5555', 'http:// 192.168.1.111:5555', undefined,'http://localhost:3000'];
var corsOptions = {
    credentials: true,
    origin: function (origin, callback) {
        console.log('origin: '+origin);
        if (whitelist.indexOf(origin) !== -1) {
            callback(null, true)
        } else {
            callback(new Error('Not allowed by CORS'))
        }
    }
};
app.use(cors(corsOptions));

app.use(session({
    saveUninitialized:false,
    resave:false,
    secret:'dfhbdfgergerh2654151her',
    cookie:{
        maxAge:20*60000,
    }
}));



const upload = multer({dest: 'tmp_uploads/'});



var mysqlConnection=mysql.createConnection({
    host:'localhost',
    user:'clifford',
    password:'12345',
    database:'the_wheel',
    multipleStatements:true

});

mysqlConnection.connect((err)=>{
    if(!err)
        console.log('DB connection succeded');
    else
        console.log('DB connection failed \n Error:'+JSON.stringify(err,undefined,2));
})


//拿到所有會員資料
app.get('/member',(req,res)=>{
    mysqlConnection.query('SELECT*FROM member',(err,rows,fields)=>{

        for(let s in rows){
            rows[s].m_birthday2=moment(rows[s].m_birthday).format('YYYY-MM-DD');
        }

        if(!err)       
        res.send(rows)
        else
        console.log(err);
    })
});



//拿到一個會員的資料
app.get('/member/:id',(req,res)=>{
    mysqlConnection.query('SELECT*FROM member WHERE m_sid = ?',[req.params.id],(err,rows,fields)=>{
        for(let s in rows){
            rows[s].m_birthday2=moment(rows[s].m_birthday).format('YYYY-MM-DD');
        }
        if(!err)
       res.send(rows);
        else
        console.log(err);
    })
});

//刪除會員資料
app.delete('/member/:id',(req,res)=>{
    mysqlConnection.query('DELETE FROM member WHERE m_sid = ?',[req.params.id],(err,rows,fields)=>{
        if(!err)
       res.send('Delete successfully.');
        else
        console.log(err);
    })
});



//上傳會員資料
app.post('/member', upload.single('avatar'),(req,res)=>{
    const data = {
        success: false,
        message: {
            type: 'danger',           
            text: '',
            info: '',
            file: ''
        }
    };
    const body = req.body;
    data.body = body;
    
    let ext = '';
    // let fname = uuidv4();
    

   

  

    if(req.file && req.file.originalname){
        let fname=sha1(req.file.originalname)
        switch(req.file.mimetype){
          
            case 'image/png':
                ext = '.png';
            case 'image/jpeg':
                if(!ext){
                    ext = '.jpg';
                }
                console.log(req.file.mimetype);
                fs.createReadStream(req.file.path)
                    .pipe(fs.createWriteStream(__dirname + '/../public/img/' + fname + ext));

            
                data.message.file='/img/' + fname + ext;
                data.info = '圖片上傳成功'
                req.body.m_photo=data.message.file;


                var sql="INSERT INTO `member` SET ?";
                mysqlConnection.query(sql,body,(err,rows,fields)=>{
                console.log(body);
     
                if (rows) {
                    data.success=true;
                    data.message.type='success';
                    data.message.text='註冊成功';
                    res.send(data);
                }else{
                 // console.log(err);
                 data.message.text='E-mail重複使用';
                 data.message.type='danger';
                 console.console(err)
                 res.send(data);
                };
            });
   
            return;
                
               
              
            default:
                data.message.info = '檔案格式不符';
                data.message.text='檔案格式不符,註冊失敗';
                res.send(data);
        }
    } else {
        data.message.info = '沒有選擇檔案';

                var sql="INSERT INTO `member` SET ?";
                mysqlConnection.query(sql,body,(err,rows,fields)=>{
                console.log(body);
     
                if (rows) {
                    data.success=true;
                    data.message.type='success';
                    data.message.text='註冊成功';
                    res.send(data);
                }else{
                 // console.log(err);
                 data.message.text='E-mail重複使用';
                 console.log(err)
                 data.message.type='danger';
                 res.send(data);
                };
            });
    }
   


    // console.log(req.body.files && req.body.files.originalname);
    console.log(req.file)
    // console.log(req.files[0].originalname)
 

    // (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    // (`m_name`, `m_mobile`, `m_email`,`m_photo`,`m_address`,`m_birthday`,`m_active`,`m_password`,`m_city`,`m_town`)
    // [body.m_name,body.m_mobile,body.m_email,body.m_photo,body.m_address,body.m_birthday,true,body.m_password,body.m_city,body.m_town]
    // let body=req.body;
  
    // console.log(req);
    // if(! body.m_name || ! body.m_email || ! body.m_mobile){
    //     data.message.text = '資料不足';
    //     res.send(data);
    //     return;
    // }

    




});


//更改會員資料
// app.put('/member/:id',(req,res)=>{
//     var sid = 'm_sid'?'m_sid' : 0;
//     let emp=req.body;
//     var sql="UPDATE `member` SET `m_name`=?, `m_mobile`=?, `m_email`=?,`m_photo`=?,`m_address`=?,`m_birthday`=?,`m_active`=?,`m_password`=?,`m_city`=?,`m_town`=?  WHERE `m_sid`=?;";
//     mysqlConnection.query(sql,[emp.m_name,emp.m_mobile,emp.m_email,emp.m_photo,emp.m_address,emp.m_birthday,true,emp.m_password,emp.m_city,emp.m_town,req.params.id],(err,rows,fields)=>{
//         if(!err)
//         res.send(rows)
//         else
//         console.log(err);
//     })
// });


app.put('/member/:id', upload.single('avatar'),(req,res)=>{
    var sid = 'm_sid'?'m_sid' : 0;
    const data = {
        success: false,
        message: {
            type: 'danger',           
            text: '資料輸入不完整',
            info: '',
            'errorCode' : 0,
            file: ''

            
        }
    };
    const body = req.body;
    data.body = body;
    
    let ext = '';
    let fname = uuidv4();

    if(req.file && req.file.originalname){
        switch(req.file.mimetype){
            case 'image/png':
                ext = '.png';
            case 'image/jpeg':
                if(!ext){
                    ext = '.jpg';
                }

                fs.createReadStream(req.file.path)
                    .pipe(fs.createWriteStream(__dirname + '/../public/img/' + fname + ext));

            
                data.message.file='/img/' + fname + ext;
                data.message.info = '圖片上傳成功'
                req.body.m_photo=data.message.file;

                var sql="UPDATE `member` SET ? WHERE `m_sid`=?";
                mysqlConnection.query(sql,[body,req.params.id],(err,rows,fields)=>{
                console.log(body);

                      
                if (rows) {

                    if(rows.message.changed==0){
                        data.success=true;
                        data.message.type='warning';
                        data.message.text='資料沒有修改';
                        console.log(err);
                        res.send(data);
                        return;
                    }


                    if(rows.changedRows!==0){
                        data.success=true;
                        data.message.type='success';
                        data.message.text='資料修改成功';
                        // res.json(rows)
                        res.send(data);
                        return;
                    }
                    
                }else{
                 // console.log(err);
                    data.success=true;
                    data.message.text='E-mail重複使用,資料修改失敗';
                    data.message.type='danger';
                    console.log(err);
                    res.send(data);
                };
            });

            return;
                

              
            default:
                data.success=false;
                data.message.info = '圖片檔案格式不符';
                data.message.text='圖片檔案格式不符';
                res.send(data);
                return;
        }
    } else {
        data.info = '沒有變更圖片';
        var sql="UPDATE `member` SET ? WHERE `m_sid`=?";
        mysqlConnection.query(sql,[body,req.params.id],(err,rows,fields)=>{
        console.log(body);

                // if(!err)
                // res.send(rows)
                // else
                // console.log(err);
        if (rows) {
            if(rows.changedRows==0){
                data.message.text='資料沒有修改';
                console.log(err);
                res.send(data);
                return;
            }
            if(rows.changedRows!==0){
            data.success=true;
            console.log(err);
            data.message.type='success';
            data.message.text='資料修改成功';
            // res.json(rows)
            res.send(data);
            return;
        }
        }else{
         // console.log(err);
            data.success=false;
            data.message.text='E-mail重複使用,資料修改失敗';
            data.message.type='danger';
            // console.log(req.params.id);
            console.log(err);
            res.send(data);
        };
    });

       
    }



    // console.log(req.body.files && req.body.files.originalname);
    console.log(req.files)
    // console.log(req.files[0].originalname)
 

    // (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    // (`m_name`, `m_mobile`, `m_email`,`m_photo`,`m_address`,`m_birthday`,`m_active`,`m_password`,`m_city`,`m_town`)
    // [body.m_name,body.m_mobile,body.m_email,body.m_photo,body.m_address,body.m_birthday,true,body.m_password,body.m_city,body.m_town]
    // let body=req.body;
  
    // console.log(req);
    


});




app.listen(5555, ()=>{
    console.log('server running');
});

