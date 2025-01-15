const {check}=require('express-validator');

exports.registerValidator=[
    check('name',"Name is required").not().isEmpty(),
    check('email',"please include a valid email").isEmail().normalizeEmail({
        gmail_remove_dots:true

    }),
    check('mobile',"Moblie Number shouldnot exceed length").isLength({
        min:10,
        max:10
    }),
    check('password',"Your password must be at least 8 characters long and contain a mix of uppercase, lowercase, numbers, and special characters (e.g., !@#$%^&*).").isStrongPassword({
        minLength:8,
        minLowercase:1,
        minUppercase:1,
        minNumbers:1,
        minSymbols:1
    }),
    check('image').optional().custom((value,{req})=>{
        if(req.file.mimetype=='image/jpeg'||file.mimetype=='image/jpeg'){
            return true;
          }else{
             return false;
          }
    }).withMessage("the image file should be of jpeg or png format only")
]

exports.sendMailVerificationValidator=[
    check('email',"please include a valid email").isEmail().normalizeEmail({
        gmail_remove_dots:true
    })
];