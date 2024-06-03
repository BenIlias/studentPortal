const express = require('express')
var Decimal = require('decimal');
const app = express();
const mongoose = require('mongoose')
const axios = require('axios');
//const port = process.env.PORT 
const NewStudent = require('./models/newStudent')
const rn = require('random-number');
var randomstring = require("randomstring");
let sendUser = '';




const dbUrl = 'mongodb+srv://benilias:benilias@cluster0.ip9bmnu.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
mongoose.connect(dbUrl).then(() => {
    console.log('Connected to db');
    app.listen(8000);


}).catch(err => console.log(err))



// setup view engine
app.set('view engine', 'ejs')

// middleware and static files
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));


// routes


app.get('/', (req, res) => {
    res.redirect('/loginFrm')
});


app.get('/library', (req, res) => {
    res.render('library')
})

const createNewInvoice = function (idStudent) {
    const axios = require('axios');
    let data = JSON.stringify({
        "amount": 5,
        "dueDate": "2024-11-06",
        "type": "LIBRARY_FINE",
        "account": {
            "studentId": idStudent
        }
    });

    let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: 'http://localhost:8081/invoices/',
        headers: {
            'Content-Type': 'application/json'
        },
        data: data
    };

    // Return the whole Promise chain
    return axios.request(config)
        .then((response) => {
            const ref = JSON.stringify(response.data.reference);
            return ref; // Return the reference
        })
        .catch((error) => {
            console.log(error);
            throw error; // Re-throw the error to propagate it further
        });
}




app.get('/enrolled', (req, res) => {
    res.render('enrolled')
})

app.get('/myenrollement', (req, res) => {
    NewStudent.findById(sendUser._id)
        .then(student => {
            res.render('myenrollement', { student })
        })

});


app.post('/enrollement', (req, res) => {
    const body = req.body
    res.render('enrollement', { body })

});
/// YDZOYFQJ

app.get('/enrollement/:idUser/:titleForm/:courseDetails/:courseFees', (req, res) => {
    const params = req.params;
    NewStudent.findById(sendUser._id)
        .then(student => {
            if (!student.invoiceRef) {
                return createNewInvoice(student.idStudent).then(ref => {
                    student.invoiceRef = JSON.parse(ref)
                    student.titleForm = params.titleForm
                    student.courseDetails = params.courseDetails
                    student.courseFees = params.courseFees
                    sendUser = student
                    return student.save()
                    
                })
                .catch(err => console.log(err))

            } else {
                student.invoiceRef = student.invoiceRef
                return student;
            }
        }).then(student => {
            res.json({ student, redirection: '/enrolled', params })
        })
        .catch(err => console.log(err))
});

function createFiananceAccount(idStudent, libFun) {
    
    let data = JSON.stringify({
        "studentId": idStudent
    });

    let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: 'http://localhost:8081/accounts/',
        headers: {
            'Content-Type': 'application/json'
        },
        data: data
    };

    axios.request(config)
        .then((response) => {
            const idS = response.data.studentId;
            createNewLibraryAccount(idS);
            
        })
        .catch((error) => {
            console.log(error);
        });
}

function createNewLibraryAccount(studentId) {
    
    let data = JSON.stringify({
        "studentId": studentId
    });

    let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: 'http://localhost/api/register',
        headers: {
            'Content-Type': 'application/json',
            'Cookie': 'session=0OofiBsK-fjiHDipPMxisMSmB4hok2ezyHwaaolhKLc'
        },
        data: data
    };

    axios.request(config)
        .then((response) => {
            console.log(JSON.stringify(response.data));
        })
        .catch((error) => {
            console.log(error);
        });
}




app.post('/checkerPage', (req, res) => {
    const newStudent = new NewStudent(req.body);
    const ranNumber = rn({ min: 100000, max: 999999, integer: true });
    newStudent.idStudent = `c7${ranNumber}`;

    newStudent.save().then(result => {
        createFiananceAccount(result.idStudent)
        res.render('congraFrm', { userName: newStudent.userName })


    }).catch(err => {

        res.render('registerFrm', { checkVar: 'This user is already exist' })

    })

});

app.get('/loginFrm', (req, res) => {
    res.render('loginFrm', { checkVar: false })
});



app.get('/registerFrm', (req, res) => {
    res.render('registerFrm', { checkVar: '' });

});

app.get('/home', (req, res) => {
    res.render('home', { sendUser })

});

app.get('/homeE', (req, res) => {
    res.render('homeE', { sendUser })

});

app.get('/studentProfile', (req, res) => {
    res.render('studentProfile', { sendUser })
})

app.get('/courses', (req, res) => {
    res.render('courses')
});


app.post('/studentProfile', (req, res) => {
    const params = req.body;
    NewStudent.findByIdAndUpdate(sendUser._id, {
        userName: params.userName,
        emailAddress: params.emailAddress
    }).then(result => {
        return NewStudent.findById(result._id)
    }).then(user => {
        sendUser = user
        res.render('studentProfile', { sendUser: user })
    })
})

function getInvoice(reference) {
    const axios = require('axios');

    let config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: `http://localhost:8081/invoices/reference/${reference}`,
        headers: {}
    };

    return axios.request(config)
        .then((response) => {
            return JSON.stringify(response.data);
        })
        .catch((error) => {
            console.log(error);
        });


}
app.get('/graduation', (req, res) => {
    getInvoice(sendUser.invoiceRef)
        .then(data => JSON.parse(data))
        .then(data => {
            if (data.status === "PAID") {
                res.render('graduation', { sendUser, statusCase: "eligible to graduate", color: 1 })
            } else {
                res.render('graduation', { sendUser, statusCase: "ineligible to graduate", color: 0 })
            }

        })

    //
})


app.post('/checkerLogin', (req, res) => {
    let checker = false
    const userData = req.body;

    NewStudent.find()
        .then(users => {
            users.forEach(user => {
                if (((user.userName === userData.emailOrUser) || (user.emailAddress === userData.emailOrUser)) && (user.passWord === userData.passWord)) {
                    checker = true
                    sendUser = user
                    console.log(user)
                    

                }
            });
            if (checker) {
                if (!sendUser.invoiceRef) {
                    res.render('home', { sendUser })
                } else {
                    res.render('homeE', { sendUser })

                }



            } else {
                res.render('loginFrm', { checkVar: 'The infos are wrong, please try again' })
            }
        })
});