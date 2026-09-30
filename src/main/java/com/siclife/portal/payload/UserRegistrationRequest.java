package com.siclife.portal.payload;

import com.siclife.portal.model.Role;
import lombok.Data;

@Data
public class UserRegistrationRequest {
    private String fullName;
    private String username;
    private String password;
    private String email;
    private Role role;
}