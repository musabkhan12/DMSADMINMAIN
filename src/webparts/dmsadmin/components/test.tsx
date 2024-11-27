
  // @ts-ignore
  import * as React from "react";
  import { getSP } from "../loc/pnpjsConfig";
  import { SPFI } from "@pnp/sp";
  import "bootstrap/dist/css/bootstrap.min.css";
  import Swal from "sweetalert2";
  // import "bootstrap//dist/"
  import "../../../CustomCss/mainCustom.scss";
  // import "../../verticalSideBar/components/VerticalSidebar.scss";

  // import { useState , useEffect } from "react";
  import Provider from "../../../GlobalContext/provider";
  import { useMediaQuery } from "react-responsive";
  import "@pnp/sp/webs";
  import "@pnp/sp/folders";
  import "@pnp/sp/files";
  import "@pnp/sp/sites"
  import "@pnp/sp/presets/all"
  import "@pnp/sp/webs";
  import "@pnp/sp/sites";
  import "@pnp/sp/site-users/web";
  import { PermissionKind } from "@pnp/sp/security";
  import "bootstrap/dist/css/bootstrap.min.css";
  import "../../../CustomCss/mainCustom.scss";
   import "../../verticalSideBar/components/VerticalSidebar.scss";
  import "./dmscss.css";
  import { useState , useRef , useEffect} from "react";

  
  import {IDmsMusaibProps} from './IDmsMusaibProps'

import "./testcss.css";
  
  const Test = ({ props }: any) => {
    const sp: SPFI = getSP();
  
   useEffect(()=>{

const currentDate = new Date();

const monthNumber = currentDate.getMonth() + 1;

const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];
const monthName = monthNames[currentDate.getMonth()];

console.log("Current Month Number:", monthNumber); 
console.log("Current Month Name:", monthName); 

async function eventthismonth () { 
      const handleSubmitFiles = async () => {
        // const folderAddResult = await sp.web.folders.addUsingPath(`/sites/SPFXDemo/ARGProjectsFiles/newfolder`);
        // console.log(folderAddResult)
        // alert(folderAddResult)
        try {
          let folderpath = '/sites/SPFXDemo/ARGProjectsFiles/newfolder';
          
          // Step 1: Create the folder
          const folderAddResult = await sp.web.folders.addUsingPath(folderpath);
          console.log(`Folder created at: ${folderpath}`);
          
          // Step 2: Break role inheritance and remove all unique permissions
          const folderItem = await folderAddResult.folder.getItem();
          await folderItem.breakRoleInheritance(true, false); // Break inheritance and clear existing permissions
          
          // // Fetch existing role assignments
          // const roleAssignments = await folderItem.roleAssignments();
        
          // // Define a RoleDefId to remove, e.g., "Read" or "Contribute" (fetch RoleDefId if needed)
          // const roleDefinitions = await sp.web.roleDefinitions();
          // const readRoleDef = roleDefinitions.find((def:any) => def.Name === "Read");
          // const roleDefId = readRoleDef ? readRoleDef.Id : null;
          
          // if (!roleDefId) {
          //   throw new Error('Role definition ID not found.');
          // }
        
          // // Iterate and remove each role assignment
          // for (const roleAssignment of roleAssignments) {
          //   const { PrincipalId } = roleAssignment;
          //   await folderItem.roleAssignments.remove(PrincipalId, roleDefId);
          // }
        
          // console.log(`Role inheritance broken and permissions cleared for: ${folderpath}`);
        } catch (error) {
          console.error("Error creating folder or modifying permissions:", error);
        }
        
        };
        handleSubmitFiles()
   }
   eventthismonth()


})


const [isPopupVisible, setPopupVisible] = useState(false);


const togglePopup  =async () => {
  const ids = window.location.search;
const originalString = ids;
const idNum = originalString.substring(1);
alert(idNum)

  const getdata :any= await sp.web.lists.getByTitle('ARGProject').items.getById(parseInt(idNum))()
  console.log(getdata , "get data ")

    if (getdata.FolderInProgress === null || getdata.FolderInProgress === "") {
    
      setPopupVisible(!isPopupVisible);
    } else if (getdata.FolderInProgress === "In Progress") {
    
      Swal.fire({
        title: 'Folder is in progress!',
        text: 'Please wait until the process is complete.',
        icon: 'warning',
        confirmButtonText: 'OK',
      });
    } else if (getdata.FolderInProgress === "Completed") {

      Swal.fire({
        title: 'Folder is already created!',
        text: 'The folder has already been created.',
        icon: 'success',
        confirmButtonText: 'OK',
      });
    }
};

  const [name, setName] = useState('');
  const [Overview, setOverview] = useState('');


  const UpdateItemAndCreateFolder = async (e:any) => {
    e.preventDefault(); 


    if (!name || !Overview) {

      Swal.fire({
        title: 'Error!',
        text: 'Please fill in all required fields.',
        icon: 'error',
        confirmButtonText: 'OK',
      });
    } else {
    
      try {

        console.log('Form submitted:', { name, Overview });
        const ids = window.location.search;
        const originalString = ids;
        const idNum = originalString.substring(1);
        console.log(name, "name" , Overview , "overview")
        const updatedValues = {
  
          ProjectFolderName : name,
          FolderOverview: Overview,
          FolderInProgress: "In Progress"
        };
    
     
         await sp.web.lists.getByTitle('ARGProject').items.getById(parseInt(idNum)).update(updatedValues);
    
        Swal.fire({
          title: 'Success!',
          text: 'The form was submitted successfully.',
          icon: 'success',
          confirmButtonText: 'OK',
        });
        setPopupVisible(!isPopupVisible);
      } catch (error) {

        Swal.fire({
          title: 'Error!',
          text: 'Something went wrong. Please try again.',
          icon: 'error',
          confirmButtonText: 'OK',
        });
      }
    }
  };
    return (
      <div id="wrapper" >
          <p>Hello</p>

  <button className="open-popup-btn" onClick={togglePopup}>
        Open Popup
      </button>
          {isPopupVisible && (
        <div className="popup">
          <div className="popup-content">
            <button className="close-btn" onClick={togglePopup}>
              &times; {/* Cross mark */}
            </button>
            <h2>Popup Form</h2>
            <form>
              <label htmlFor="name">Folder Name:</label>
              <input  type="text"
        id="name"
        name="name"
        value={name}
        onChange={(e) => setName(e.target.value)} />
              <br />
              <label htmlFor="Overview">Overview:</label>
              <input  type="email"
        id="Overview"
        name="Overview"
        value={Overview}
        onChange={(e) => setOverview(e.target.value)} />
              <br />
              <button type="submit" onClick={UpdateItemAndCreateFolder}>Submit</button>
            </form>
          </div>
        </div>
      )}
            </div>
          
     
          
    );
  };
  
  
  
  const TEST: React.FC<IDmsMusaibProps> = (props) =>{
    return (
      <Provider>
        <Test  props={props}/>
      </Provider>
    );
  };
  
  export default TEST;
  