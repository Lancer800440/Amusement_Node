import bcrypt from "bcryptjs";

const hash = "$2a$08$xOCdq5CReEiDcbVogOIAiO5XVR/cpmVMWwZwVo6/wmvmCwGrdLUb2";

console.log( await bcrypt.compare("1234567", hash) );
