import React, { useEffect, useRef, useState } from "react";
import Select from "react-select";
import { getSP , getGraphClient } from "../loc/pnpjsConfig";
import { SPFI } from "@pnp/sp";
import Swal from "sweetalert2";
import styles from './Form.module.scss'
let superA=false;
let usersFromGroups:any[]=[];
let selectedEntityForPermission:any;
let groupDetails:any;
let selectedGroupUsers:any
let selectedUsersForPermission:any;
let seleccteduserforapproval:any
let selectedGropuForPermission:any;
let superAdminArray:any[];
const ManageFolderDeligation = (props:any) => {
    const sp: SPFI = getSP();
    const [adminPermissionEntity,setAdminPermissionEntity]=useState<any[]>([]);
    const [IsSuperAdmin,setIsSuperAdmin]=useState(false);
    const [user,setUser]=useState<any[]>([]);
    const [allUsersFromGroups,setAllUsersFromGroups]=useState<any[]>([]);
    const [allUsersFromADMINGroups,setAllUsersFromADMINGroups]=useState<any[]>([]);
    const [toggleManagePermission,setToggleManagePermission]=useState('Yes');
    const [showGroupsTable,setShowGroupsTable]=useState("No");
    const [showGroupsUsers,setShowGroupsUsers]=useState("No");
    const [groups,setGroups]=useState<any[]>([]);
    const currentUserEmailRef = useRef('');
    useEffect(() => {
        getcurrentuseremail();
       
      }, []);
    const getcurrentuseremail = async()=>{
        const userdata = await sp.web.currentUser();
        currentUserEmailRef.current = userdata.Email;
 
        getDetailsOfAdmin();  
        getDetailsOfSuperAdmin()
        fetchUsers()
      }
      const getDetailsOfSuperAdmin=async()=>{
        try {
            const usersFromDMSSuperAdmin = await sp.web.siteGroups.getByName('DMSSuper_Admin').users();
            superAdminArray=usersFromDMSSuperAdmin;
            usersFromDMSSuperAdmin.forEach((user)=>{
                if(user.Email === currentUserEmailRef.current){
                  superA=true;
                  setIsSuperAdmin(true);
                  // setToggleManagePermission('Yes');
                }
            })
            console.log("usersFromDMSSuperAdmin",usersFromDMSSuperAdmin);
        } catch (error) {
          console.log("error in getting the details of super admin",error);
        }
      }
      const fetchUsers=async()=>{
        const user = await sp.web.siteUsers();
        console.log("users fetch from the site",user);
          const usersArray=user.map((user)=>(
                {
                  id:String(user.Id),
                  value: user.Title,
                  email: user.Email,
                  label:user.Title,
                  loginName:user.LoginName
                }
          ))
          console.log("site users",usersArray);
          setUser(usersArray);
      }
    const getDetailsOfAdmin=async()=>{
        try {
            const entityDetails=await sp.web.lists.getByTitle("MasterSiteURL").items.select("SiteURL","Title","Active","SiteID").filter(`Active eq 'Yes'`)();
            console.log("entityDetails",entityDetails);
            let entityArray:any[]=[]
            const subsiteAdminDetails = await Promise.all(
              entityDetails.map(async (entity:any) => {
                try {
                  const subsiteContext = await sp.site.openWebById(entity.SiteID);
                  const usersFromAdmin = await subsiteContext.web.siteGroups.getByName(`${entity.Title}_Admin`).users();
                  console.log("IsSuperAdmin from entityDeatils forEach",IsSuperAdmin,superA,usersFromAdmin);
                  if(superA || usersFromAdmin.length !== 0){
                      if(usersFromAdmin.length !== 0 && superA === false){
                        // usersFromAdmin.forEach((user)=>{
                        for(const user of usersFromAdmin){
                          if(user.Email === currentUserEmailRef.current){
                              console.log("current user is Admin",currentUserEmailRef.current);
                              console.log("entity",entity.Title);
                              console.log("all users in the admin group",usersFromAdmin);
                              entityArray.push({
                                value:entity.Title,
                                label:entity.Title,
                                SiteID:entity.SiteID
                              });
                              return usersFromAdmin;
                          }
                        }
                      }
                      if(superA){
                        // console.log("current user is super admin",IsSuperAdmin);
                        // console.log("user is super admin",currentUserEmailRef.current);
                        // console.log("entity",entity.Title);
                        // console.log("users from the admin group",usersFromAdmin);
                        entityArray.push({
                          value:entity.Title,
                          label:entity.Title,
                          SiteID:entity.SiteID
                        });
                        return usersFromAdmin;
                      }
                  }
                  // entityArray.push({
                  //   value:entity.Title,
                  //   label:entity.Title,
                  //   SiteID:entity.SiteID
                  // });
                  // return usersFromAdmin;
                } catch (error) {
                  // If the error is permission-related, return an undefined instead of throwing
                  console.log("Error in getting group users. Returning empty array for", entity.Title, error);
                  return undefined;
                }
              })
            );
            console.log("subsiteAdminDetails",subsiteAdminDetails);
            console.log("entityArray",entityArray);
            let finalUserArray:any[]=[];
            subsiteAdminDetails.forEach((userArray) => {
              if (userArray) {
                userArray.forEach((user) => {
                  // Push the desired object structure into the result array
                  finalUserArray.push({
                    email: user.Email,
                    Id: user.Id,
                    value: user.Title,
                    label: user.Title
                  });
                });
              }
            });
            // Set a flag if all elements are undefined or null
            const allUndefined = subsiteAdminDetails.every(userArray => 
                userArray === undefined || (Array.isArray(userArray) && userArray.every(user => !user))
              );
            if(!allUndefined){
              // IsAdmin=true;
              setToggleManagePermission("Yes");
            }
            
            setAdminPermissionEntity(entityArray);
            console.log("allUndefined",allUndefined);
            console.log("finalUserArray",finalUserArray);
        }catch (error) {
          console.log("error getting entity details",error);
        }
      }

      const handleEntitySelect=async(selectedEntity:any)=>{
        console.log("selectedEntity",selectedEntity);
        selectedEntityForPermission=selectedEntity;
        const subsiteContext = await sp.site.openWebById(selectedEntity.SiteID);
        if(IsSuperAdmin){
          try {
            const usersFromAdmin = await subsiteContext.web.siteGroups.getByName(`${selectedEntity.value}_Admin`).users();
            console.log("usersFromAdmin -> IsSuperAdmin",usersFromAdmin);
            // console.log("IsAdmin",IsAdmin);
            // Check if current user email exists in the usersFromAdmin list
            const emailExists = usersFromAdmin.some(user => user.Email.toLowerCase() === currentUserEmailRef.current.toLowerCase());
            console.log("emailExists",emailExists);
            if(!emailExists){
              console.log(`${currentUserEmailRef.current} does not exist in the list. Adding to the admin group.`);
              const userObj = await sp.web.ensureUser(currentUserEmailRef.current);
              console.log("userObj",userObj);
              const users=await subsiteContext.web.siteGroups.getByName(`${selectedEntity.value}_Admin`).users.add(userObj.data.LoginName);
              console.log(`User Added Succecssfully in the ${selectedEntity.value}_Admin`,users);
            }else{
              console.log(`${currentUserEmailRef.current} already exists in the list.`);
            }

          } catch (error) {
            console.log(`Error in Adding super admin to the ${selectedEntity.value}_Admin gropup`,error)
          }
        }
        
        // Fetch all the groups in the subsite
        interface IMember {
          PrincipalType: number;
          Title:String;
          Id:number 
        }
        interface IRoleAssignmentInfo {
          Member?: IMember; 
        }
        const groups3:IRoleAssignmentInfo[] = await subsiteContext.web.roleAssignments.expand("Member")();
        console.log("groups3",groups3);
        // const onlyFolderDeligationuser = groups3.find( )
        const filteredMembers=groups3.filter(roleAssignment => {
          return roleAssignment.Member.PrincipalType === 8;
        });

        const filteredGroups = filteredMembers.map((object:any) => (
            
            {
       
            value: object.Member.Title,
            label: object.Member.Title,
            Id: object.Member.Id,
        }));
        console.log("filteredGroups",filteredGroups);
        console.log("filteredMembers",filteredMembers);
        // filter the DMSSuper_Admin
        const filteredRoles = filteredGroups.filter(role => role.value !== "DMSSuper_Admin");
        console.log("filteredRoles before permission",filteredRoles);
        // let usersFromGroups:any[]=[];
        usersFromGroups=[];
    

        await Promise.all(filteredRoles.map(async (group) => {
            // alert(group)
          const result = group.value.split("_")[1];
          let permission = "";
          let description = "";
          
          // Determine permission and description based on result
          switch (result) {
            case "Admin":
              permission = "Admin";
              description = "Full Control - Has full control.";
              break;
            case "Contribute":
              permission = "Contribute";
              description = "Can view, add, update, and delete documents.";
              break;
            case "Read":
              permission = "Read";
              description = "Can view pages and download documents.";
              break;
            case "View":
              permission = "View";
              description = "Can only view content.";
              break;
            case "Initiator":
              permission = "Initiator";
              description = "Can view, add, update, and delete documents.";
              break;
            case "Approval":
              permission = "Approval";
              description = "Can view, add, update, and delete documents.";
              break;
            case "AllUsers":
              permission = "AllUsers";
              description = "Can view, add, update, and delete documents.";
              break;
            case "FolderDeligation ":
              permission = "FolderDeligation ";
              description = "Can create Folder on behlaf of Admin";
              break;
            default:
              permission = "Unknown";
              description = "Unknown role";
              break;
          }
          
          (group as any).permission=permission;
          (group as any).Description=description;

          // Fetch users based on group name
          const users = await subsiteContext.web.siteGroups.getByName(`${group.value}`).users();
      
          // Add each user to the usersFromGroups array
          users.forEach((user) => {
            usersFromGroups.push({
              user: user.Title,
              email: user.Email,
              groupName: group.value,
              permission:permission,
              Descirption: description,
              userId: user.Id,
            });
          });
        }));
      
        console.log("allUsersFromGroups",usersFromGroups);
        console.log("filteredRoles",filteredRoles);
        // New code start filter the group and its description
        groupDetails=filteredRoles.find(item => item.value === `${selectedEntity.value}_FolderDeligation`);
        let getapprovaluserfromadmingroup = filteredRoles.find(item => item.value === `${selectedEntity.value}_Admin`);
        console.log("groupDetails",groupDetails);
        selectedGropuForPermission=groupDetails;
        try {
          const subsiteContext = await sp.site.openWebById(selectedEntityForPermission.SiteID);
          const usersFromSelectedGroups = await subsiteContext.web.siteGroups.getByName(`${groupDetails.value}`).users();
          const usersFromapprovalGroups = await subsiteContext.web.siteGroups.getByName(`${getapprovaluserfromadmingroup.value}`).users();
          console.log("usersFromSelectedGroups",usersFromSelectedGroups);
          console.log("usersFromapprovalGroups",usersFromapprovalGroups);
          selectedGroupUsers=usersFromSelectedGroups;
          
            const showUsersFromGroupsOnTable=usersFromSelectedGroups.map((user)=>{
              return {
                user: user.Title,
                email: user.Email,
                groupName: groupDetails.value,
                permission:groupDetails.permission,
                Descirption: groupDetails.Description,
                userId: user.Id,
              }
            })
            const setusersFromapprovalGroups =usersFromapprovalGroups.map((user)=>{
              return {
                 id:user.Id,
                  value: user.Title,
                  email: user.Email,
                  label:user.Title,
                  loginName:user.LoginName
              }
            })


          console.log("showUsersFromGroupsOnTable1",showUsersFromGroupsOnTable);
          setAllUsersFromGroups([]);
          setAllUsersFromGroups(showUsersFromGroupsOnTable);
          setShowGroupsUsers("Yes");

          setAllUsersFromADMINGroups(setusersFromapprovalGroups)


        } catch (error) {
          console.log("error from getting the users from the groups after selecting the groups",error);
        }
        
        // end
        setGroups(filteredRoles);
        // setAllUsersFromGroups([]);
        // setAllUsersFromGroups(usersFromGroups);
        setShowGroupsTable("Yes");
    }

    const handleGroupsSelect=async(selectedGrous:any)=>{
        // Set selected groups start
        groupDetails=selectedGrous;
        // End
          console.log("selectedGrous",selectedGrous);
          console.log("selectedEntityForPermission",selectedEntityForPermission);
          selectedGropuForPermission=selectedGrous;
          try {
            const subsiteContext = await sp.site.openWebById(selectedEntityForPermission.SiteID);
            const usersFromSelectedGroups = await subsiteContext.web.siteGroups.getByName(`${selectedGrous.value}`).users();
            console.log("usersFromSelectedGroups",usersFromSelectedGroups);
            selectedGroupUsers=usersFromSelectedGroups;
  
              const showUsersFromGroupsOnTable=usersFromSelectedGroups.map((user)=>{
                return {
                  user: user.Title,
                  email: user.Email,
                  groupName: selectedGrous.value,
                  permission:selectedGrous.permission,
                  Descirption: selectedGrous.Description,
                  userId: user.Id,
                }
              })
            console.log("showUsersFromGroupsOnTable",showUsersFromGroupsOnTable);
            setAllUsersFromGroups([]);
            setAllUsersFromGroups(showUsersFromGroupsOnTable);
            setShowGroupsUsers("Yes");
          } catch (error) {
            console.log("error from getting the users from the groups after selecting the groups",error);
          }
          
  
      }
      const handleUsersSelect=(selectedUser:any)=>{
        console.log("selectedUser",selectedUser);
        selectedUsersForPermission=selectedUser;
  }
      const handleUsersforapprovalSelect=(selectedUser:any)=>{
        console.log("selectedUser",selectedUser);
        seleccteduserforapproval=selectedUser;
  }
  const onSuccess=(groupName:any)=>{
    Swal.fire({
      title: "Added!",
      text: `User Added Suucessfuly to the ${groupName}.`,
      icon: "success"
    });
  }
  const checkValidation=()=>{
    Swal.fire("Please fill out the fields!", "All fields are required");
}
  const handleAddUsers = async () => {
    console.log("selectedUsersForPermission", selectedUsersForPermission);
    console.log("selectedGropuForPermission", selectedGropuForPermission);
    console.log("selectedEntityForPermission", selectedEntityForPermission);

    if (
      selectedUsersForPermission === undefined ||
      selectedUsersForPermission.length === 0
    ) {
      checkValidation();
      return;
    }
    if (
      allUsersFromADMINGroups === undefined ||
      allUsersFromADMINGroups.length === 0
    ) {
      checkValidation();
      return;
    }
    if (selectedGropuForPermission === undefined) {
      checkValidation();
      return;
    }
    if (selectedEntityForPermission === undefined) {
      checkValidation();
      return;
    }

    const subsiteContext = await sp.site.openWebById(
      selectedEntityForPermission.SiteID
    );
    //wait for all add operations to complete
    // const addUsersPromises = selectedUsersForPermission.map(
    //   async (user: any) => {
    //     try {
    //       const userObj = await sp.web.ensureUser(user.email);
    //       console.log("userObj", userObj);
    //       const users = await subsiteContext.web.siteGroups
    //         .getByName(`${selectedGropuForPermission.value}`)
    //         .users.add(userObj.data.LoginName);
    //       console.log(`${user.email} added to the group successfully.`, users);
           
    //       const addedItem = await sp.web.lists.getByTitle("DMSFolderDeligationApprovalMaster").items.add({
    //         Title : selectedEntityForPermission.value,
    //         CurrentUser	: selectedUsersForPermission[0].email ,
    //         Approvals: {
    //           results: seleccteduserforapproval.map((user:any) => ({
    //             Key: user.loginName
    //           }))
    //         }
    //         // Approvals : 
    //       });


    //     } catch (error) {
    //       console.error(`Failed to add ${user.email} to the group: `, error);
    //     }
    //   }
    // );
// If selectedUsersForPermission is a single object
const user = selectedUsersForPermission;

try {
  const userObj = await sp.web.ensureUser(user.email);
  console.log("userObj", userObj);
  
  const users = await subsiteContext.web.siteGroups
    .getByName(`${selectedGropuForPermission.value}`)
    .users.add(userObj.data.LoginName);
  console.log(`${user.email} added to the group successfully.`, users);
  // Prepare array of user IDs for the Approvals field
  // const approvalUserIds = seleccteduserforapproval.map((approvalUser: any) => 
  //   Number(approvalUser.id) // Ensure this is converting the user ID to a number
  // );
 
const approvalUserIds = seleccteduserforapproval.map((approvalUser: any) => 
  Number(approvalUser.id) // Ensure this is converting the user ID to a number within an object
);
  const addedItem = await sp.web.lists.getByTitle("DMSFolderDeligationApprovalMaster").items.add({
    Title: selectedEntityForPermission.value,
    SiteTitle: selectedEntityForPermission.value,
    CurrentUser: user.email,
    ApprovalsId: approvalUserIds // Ensure this is an array of objects with Key properties
    
  });
  
  console.log("Added item:", addedItem);
  

  console.log("Added item:", addedItem);
} catch (error) {
  console.error(`Failed to add ${user.email} to the group: `, error);
}

    // await Promise.all(users);
    onSuccess(selectedGropuForPermission.value);
    handleGroupsSelect(selectedGropuForPermission);
  };

const confirmDelete=(group:any,userId:any,groupName:any)=>{
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, Removed it!"
    }).then(async(result) => {
      if (result.isConfirmed) {
        await group.users.removeById(userId);
        console.log(`User with ID ${userId} has been removed from the group '${groupName}'`);
          // to refresh the user table
          // handleEntitySelect(selectedEntityForPermission);
          handleGroupsSelect(selectedGropuForPermission);
        Swal.fire({
          title: "Removed!",
          text: `User Suucessfuly removed from ${groupName}.`,
          icon: "success"
        });
      }
    });
  }
const handleDeleteUser=async(userId:any,groupName:any)=>{
    console.log("UserId",userId);
    try {

        const subsitecontext=await sp.site.openWebById(selectedEntityForPermission.SiteID);
        // Get the group by name
        const group =subsitecontext.web.siteGroups.getByName(groupName);
        // Remove the user from the group using their userId
        confirmDelete(group,userId,groupName);
        // await group.users.removeById(userId);
    } catch (error) {
        console.error("Error removing user from group: ", error);
    }
}

  // Add pagination start
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(allUsersFromGroups.length / itemsPerPage);
  
  const handlePageChange = (pageNumber: any) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };
  
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = allUsersFromGroups.slice(startIndex, endIndex);

  interface PaginationProps{
    currentPage: number;
    totalPages: any;
    handlePageChange: any;
  }
  const Pagination = ( { currentPage, totalPages, handlePageChange }: PaginationProps) => {
    const pageLimit = 5; // Number of visible page items
  
    // Determine the start and end page based on the current page and total pages
    const startPage = Math.max(1, currentPage - Math.floor(pageLimit / 2));
    const endPage = Math.min(totalPages, startPage + pageLimit - 1);
  
    // Adjust start page if it's too close to the end
    const adjustedStartPage = Math.max(1, Math.min(startPage, totalPages - pageLimit + 1));
  
    // Create an array for the visible page numbers
    const visiblePages = Array.from(
      { length: Math.min(pageLimit, totalPages) },
      (_, index) => adjustedStartPage + index
    );
  
    return (
      <nav className="pagination-container">
        <ul className="pagination">
          {/* Previous Button */}
          <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
            <a
              className="page-link PreviousPage"
              onClick={() => handlePageChange(currentPage - 1)}
              aria-label="Previous"
            >
              «
            </a>
          </li>
  
          {/* Render visible page numbers */}
          {visiblePages.map((pageNumber) => (
            <li
              key={pageNumber}
              className={`page-item ${currentPage === pageNumber ? 'active' : ''}`}
            >
              <a className="page-link" onClick={() => handlePageChange(pageNumber)}>
                {pageNumber}
              </a>
            </li>
          ))}
  
          {/* Next Button */}
          <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
            <a
              className="page-link NextPage"
              onClick={() => handlePageChange(currentPage + 1)}
              aria-label="Next"
            >
              »
            </a>
          </li>
        </ul>
      </nav>
    );
  };


  // End
    return <div>
          <div className="position-relative">
          <div>
            {/* <button className="btn back-to-admin" onClick={()=>handleReturnToMainFromPermissionTable('')}>Back To Main</button> */}
           
           </div>
            <div style={{
                  
                      position:"relative",
                  
                      marginTop:"70px",
                      padding:"20px",
                      border:"2px solid #54ade0",
                      borderRadius:"20px",
                      background:"#fff",
                      clear:"both",
                      float:"left",
                      width:"100%"
  
                    }}>
                    <p className="font-20" style={{ 
                  
                    }}>Manage Users And Permission</p>
                    <div className="row">
                      <div className="col-sm-4">
                        <label>Entity</label>
                        <Select                        
                            options={adminPermissionEntity}
                            onChange={(selected: any) =>
                              handleEntitySelect(selected)
                            }
                            placeholder="Select Entity..."
                            noOptionsMessage={() => "No Entity Found..."}
                          />
                      </div>
                      <div className="col-sm-4">
                        <label>Groups</label>
                        <Select
                            isDisabled
                            options={groups}
                            onChange={(selected: any) =>
                              handleGroupsSelect(selected)
                            }
                            placeholder={`${groupDetails?.value }`}
                            noOptionsMessage={() => "No Groups Found..."}
                          />
                      </div>
                         { <div  className="col-sm-4">
                       <label>Users</label>
                        <Select
                            
                            options={user}
                            onChange={(selected: any) =>
                              handleUsersSelect(selected)
                            }
                            placeholder="Select User..."
                            noOptionsMessage={() => "No User Found..."}
                          />
                       </div> 
                       } 
                         { <div  className="col-sm-4">
                       <label>Select Approvers</label>
                        <Select
                            isMulti
                            options={allUsersFromADMINGroups}
                            onChange={(selected: any) =>
                              handleUsersforapprovalSelect(selected)
                            }
                            placeholder="Select User..."
                            noOptionsMessage={() => "No User Found..."}
                          />
                       </div> 
                       } 
                      
                    </div>
                    <div style={{
                      display:"flex",
                      gap:"10px",
                      justifyContent:"center"
                     
                    }}>
                         <button style={{padding:'8px 10px', borderRadius:'4px'}} type="button" className="mt-4 btn btn-primary" onClick={handleAddUsers}>
                         Add
                      </button>
                  
                    </div>
                  </div>

                  {showGroupsTable ==="Yes" && (
              <div>
                                            
                        <div style={{padding:'15px',clear:'both', float:'left', marginTop:'15px'}} className={styles.container}>
                        <header style={{padding:'0px 0px 5px 0px'}}>
                        <div className='page-title fw-bold mb-1 font-20'>{selectedEntityForPermission.value} &gt; {
                        groupDetails?.value && groupDetails?.value.includes('_') 
                                  ? groupDetails?.value.split('_')[1] 
                                  : groupDetails?.value || ''} &gt; Details
                        </div>
                        </header>
                        <table className='mtbalenew'>

                            <thead>
                            <tr>
                                <th>Title</th>
                 
                                <th >Description</th>
                            </tr>
                            </thead>
                            <tbody>
                          
                            <tr>
                              <td>
                                {groupDetails?.value && groupDetails?.value.includes('_') 
                                  ? groupDetails?.value.split('_')[1] 
                                  : groupDetails?.value || ''}
                              </td>
                              <td>
                                {groupDetails?.Description || ''}
                              </td>
                            </tr>
                        </tbody>
                        </table>
                        </div>
                    {showGroupsUsers ==="Yes" && (<>
                      <div style={{padding:'15px',clear:'both', float:'left', marginTop:'15px'}} className={styles.container}>
                        <header style={{padding:'0px 0px 5px 0px'}}>
                          <div className='page-title fw-bold mb-1 font-20'>
                            {selectedEntityForPermission.value} &gt; 
                              {groupDetails.value && groupDetails.value.includes('_') 
                              ? groupDetails.value.split('_')[1] 
                              : groupDetails.value || ''}
                             &gt; Users
                          </div>
                        </header>
                        <table className='mtbalenew'>

                            <thead>
                            <tr>
                                <th style={{minWidth:'55px', maxWidth:'55px'}}>S.No.</th>
                                <th>User</th>
                                <th>User Email</th>
                                <th>Group Name</th>
                                <th>Permission</th>
                                <th>Description</th>
                                <th style={{minWidth:'65px', maxWidth:'65px'}}>Action</th>
                            </tr>
                            </thead>
                            <tbody>
                            {currentData.map((item:any, index:any) => (
                                <React.Fragment key={item.userId}>
                                <tr>
                                    <td style={{minWidth:'55px', maxWidth:'55px'}}>
                                 <span className="indexdesign">
                            
                                    {(currentPage - 1) * itemsPerPage + index + 1}
                                    </span> 
                                    </td>
                                    <td>
                                    {item.user || ''}
                                    </td>
                                    <td >
                                    {item.email || ''}
                                    </td>
                                    <td>
                                    {item.groupName || ''}
                                    </td>
                                    <td>
                                    {item.permission || ''}
                                    </td>
                                    <td>
                                    {item.Descirption || ''}
                                    </td>
                                    <td style={{minWidth:'65px', maxWidth:'65px'}}>
                                    <img
                                        className={styles.deleteicon}
                                        src={require("../assets/del.png")}
                                        alt="Delete"
                                        onClick={(event)=>{
                                            handleDeleteUser(item.userId,item.groupName)
                                        }}
                                    />
                                    </td>
                                </tr>
                                </React.Fragment>
                            ))}
                        </tbody>
                        </table>
                        <Pagination
                          currentPage={currentPage}
                          totalPages={totalPages}
                          handlePageChange={handlePageChange}
  
                        />
                      </div>
                    </>)
                    }
                
              </div>
              
            )}   
                
      </div>
          </div>;
};

export default ManageFolderDeligation;