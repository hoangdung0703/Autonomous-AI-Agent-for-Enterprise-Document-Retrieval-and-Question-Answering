# Chapter 4 Diagrams (PlantUML)

## Diagram 1: Authentication & Onboarding Flow

```plantuml
@startuml Authentication_Onboarding
left to right direction
actor Guest
actor User
actor Admin
actor "Email Service" as Email

rectangle "Authentication & Onboarding" {
  (Register)
  (Login)
  (Forgot Password)
  (Reset Password)
  (Create Organization)
  (Join Organization via Invite Code)
}

Guest --> (Register)
Guest --> (Login)
Guest --> (Forgot Password)
(Forgot Password) ..> Email : sends reset email
Guest --> (Reset Password)
User --> (Create Organization)
User --> (Join Organization via Invite Code)
@enduml
```

## Diagram 2: Main System Operations by Role

```plantuml
@startuml Main_Operations
left to right direction
actor User
actor Admin

rectangle "Document Management" {
  (List Documents)
  (Preview Document)
  (Upload Document)
  (Rename Document)
  (Reprocess Document)
  (Delete Document)
  (Query Document)
}

rectangle "Conversation Management" {
  (Create Conversation)
  (Query Conversation)
  (Manage Conversation Documents)
  (Rename Conversation)
  (Delete Conversation)
}

rectangle "Organization Management" {
  (View Organization)
  (List Members)
  (Manage Invite Codes)
  (Approve/Reject Join Request)
}

rectangle "User Profile" {
  (View Profile)
  (Edit Profile)
}

User --> (List Documents)
User --> (Preview Document)
User --> (Query Document)
User --> (Create Conversation)
User --> (Query Conversation)
User --> (Manage Conversation Documents)
User --> (Rename Conversation)
User --> (Delete Conversation)
User --> (View Profile)
User --> (Edit Profile)
User --> (View Organization)

Admin --> (List Documents)
Admin --> (Upload Document)
Admin --> (Rename Document)
Admin --> (Reprocess Document)
Admin --> (Delete Document)
Admin --> (View Organization)
Admin --> (List Members)
Admin --> (Manage Invite Codes)
Admin --> (Approve/Reject Join Request)
@enduml
```

To render: paste each block at https://www.plantuml.com/plantuml/uml/ and export as PNG.
