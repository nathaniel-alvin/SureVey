import React, {useRef, useState} from "react";
import { useHistory } from "react-router-dom";
import './Register.css';
import Camera from './Camera'
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import { nodeflux_auth, nodefluxFaceMatch } from "../nodeflux/nodeflux"

const Register = () => {

    const videoRef = useRef(null);
    const photoRef = useRef(null);
    const [base64, setBase64] = useState(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    

    const [hasPhoto, setHasPhoto] = useState(false);
    const history = useHistory();
    const [openCam, setOpenCam] = useState(false);

    const getVideo = () => {
        navigator.mediaDevices.getUserMedia({
            video: { width:1920, height:1080 }
        })
        .then(stream => {
            let video = videoRef.current;
            video.srcObject = stream;
            video.play();
        })
        .catch(err=>{
            console.error(err);
        })
    }

    const cam_button_clicked = () => {
        setOpenCam(true);
        getVideo();
    }

    const takePhoto = () => {
        const width = 720;
        const height = width / (16/9);

        let video = videoRef.current;
        let photo = photoRef.current;

        photo.width = width;
        photo.height = height;

        let ctx = photo.getContext('2d');
        ctx.drawImage(video, 0, 0, width, height);
        setHasPhoto(true);
        var b64 = photo.toDataURL('image/jpeg')
        setBase64(b64);
    }

    const retakePhoto = () => {
        let photo = photoRef.current;
        let ctx = photo.getContext('2d');

        ctx.clearRect(0, 0, photo.width, photo.height);
        setHasPhoto(false);
        setBase64(null);
    }

    const savePhoto = () => {
        setOpenCam(false);
        setHasPhoto(false);
    }

    const checkFace = async (face1, face2) => {
        let auth = await nodeflux_auth();
        var res = false;


        const doSomething = delay_amount_ms =>
            new Promise(resolve => setTimeout(() => resolve("delay"), delay_amount_ms))

        const loop = async () => {
            // set loading to true here
            let status;
            let result;
            while (['success', 'incompleted'].includes(status) !== true) {
                result = await nodefluxFaceMatch({
                    "auth_key": auth.auth_key,
                    "timestamp": auth.timestamp
                }, face1, face2)
                status = result.response.job.result.status
                await doSomething(100)
                console.log(status)
            }

            if (result.response.message === "No face detected") {
                alert("No face detected in your captured photo");
            } else if (result.response.message === "Face Match Success") {
                res = result.response.job.result.result[0].face_match.match;
            } else {
                alert(result.response.message)
            }
        }

        await loop().then(() => {console.log(res)});
    }

    const register = () => {
        if (email !== '' && password !== '') {
            fetch('https://surevey-backend.herokuapp.com/api/users/', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(
                    {
                        "id":null,
                        "email": email,
                        "image": base64,
                        "password": password,
                    }
                )
            })
            .then( res => res.json())
            .then(
                () => {
                    Navigate("/");
                }
            ).catch( error => console.error(error))    
        }
        else {
            alert("Please fill the registration form.");
        }
        
    }

    const noPic = () => {
        alert("Please take a picture of your face first.");
    }

    const passwordChanged = event => {
        setPassword(event.target.value);
    }

    const emailChange = event => {
        setEmail(event.target.value);
    }

    return (
      <div className="Register">
        <div class = "register_box_back"></div>
        <div class="register_box_front">
            <h1>Register</h1>
            <div className="register_form">
                <div class="txt_field">
                    <input type="text" name="username"
                     onChange={emailChange}
                     required/>
                    <span></span>
                    <label>Email</label>
                </div>
                <div class="txt_field">
                    <input type="password" name="password"
                     onChange={passwordChanged}
                     required/>
                    <span></span>
                    <label>Password</label>
                </div>
                <div className="register-cam">
                <button className={base64 ? "open_cam_button_has_photo" : "open_cam_button"} onClick={cam_button_clicked}><CameraAltIcon style={{ color: "white" }} /></button>
                    <button className="register_button" onClick={base64 ? register : noPic}>Register</button>
                </div>
            </div>
        </div> 
        <Camera trigger={openCam} setTrigger={setOpenCam} videoRef={videoRef} takePhoto={takePhoto}
        hasPhoto={hasPhoto} photoRef={photoRef} retakePhoto={retakePhoto} savePhoto={savePhoto}>
            <h3>Camera</h3>
        </Camera>
      </div>
    );
  }
  
  export default Register;