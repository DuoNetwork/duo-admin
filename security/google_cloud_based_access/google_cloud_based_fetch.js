const Storage = require('@google-cloud/storage');

const projectId = 'duo-network';

const storage = new Storage({
    projectId: projectId,
});

const bucketName = 'eth-test';

// storage
//     .bucket(bucketName)
//     .getFiles()
//     .then(results => {
//         const files = results[0];

//         console.log('Files:');
//         files.forEach(file => {
//             console.log(file.name);
//         });
//     })
//     .catch(err => {
//         console.error('ERROR:', err);
//     });

storage
    .bucket(bucketName)
    .file("testkey.txt")
    .download()
    .then(function (data) {
        if (data) {
            console.log(data.toString('utf-8'));
            return data.toString('utf-8');
        }
    })
    .catch(err => {
        console.error('ERROR:', err);
    });
