import React, { createContext, useContext, useMemo, useState } from 'react';
import { initialMockUsers } from '../data/mockUsers';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [users, setUsers] = useState(initialMockUsers);
    const [currentUser, setCurrentUser] = useState(null);

    const [guestSavedPlaces, setGuestSavedPlaces] = useState([]);

    const isLoggedIn = !!currentUser;

    const login = (identifier, password) => {
        const trimmedIdentifier = identifier.trim().toLowerCase();
        const trimmedPassword = password.trim();

        if (!trimmedIdentifier || !trimmedPassword) {
            return {
                success: false,
                message: 'Please enter your email or username and your password.',
            };
        }

        const user = users.find(
            (item) =>
                item.email.toLowerCase() === trimmedIdentifier ||
                item.username.toLowerCase() === trimmedIdentifier
        );

        if (!user) {
            return {
                success: false,
                message: 'No account matches this email or username. Please sign up first.',
            };
        }

        if (user.password !== trimmedPassword) {
            return {
                success: false,
                message: 'The password you entered is incorrect.',
            };
        }

        setCurrentUser(user);

        return {
            success: true,
            user,
        };
    };

    const signup = ({
        firstName,
        lastName,
        email,
        username,
        password,
        confirmPassword,
    }) => {
        const trimmedFirstName = firstName.trim();
        const trimmedLastName = lastName.trim();
        const trimmedEmail = email.trim().toLowerCase();
        const trimmedUsername = username.trim().toLowerCase();
        const trimmedPassword = password.trim();
        const trimmedConfirmPassword = confirmPassword.trim();

        if (
            !trimmedFirstName ||
            !trimmedLastName ||
            !trimmedEmail ||
            !trimmedUsername ||
            !trimmedPassword ||
            !trimmedConfirmPassword
        ) {
            return {
                success: false,
                message: 'Please fill in all required fields.',
            };
        }

        const emailRegex = /\S+@\S+\.\S+/;
        if (!emailRegex.test(trimmedEmail)) {
            return {
                success: false,
                message: 'Please enter a valid email address.',
            };
        }

        if (trimmedUsername.length < 3) {
            return {
                success: false,
                message: 'Your username must be at least 3 characters long.',
            };
        }

        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
        if (!passwordRegex.test(trimmedPassword)) {
            return {
                success: false,
                message:
                    'Your password must be at least 8 characters long and include at least one letter and one number.',
            };
        }

        if (trimmedPassword !== trimmedConfirmPassword) {
            return {
                success: false,
                message: 'The passwords do not match.',
            };
        }

        const emailExists = users.some(
            (user) => user.email.toLowerCase() === trimmedEmail
        );

        if (emailExists) {
            return {
                success: false,
                message: 'This email address is already registered.',
            };
        }

        const usernameExists = users.some(
            (user) => user.username.toLowerCase() === trimmedUsername
        );

        if (usernameExists) {
            return {
                success: false,
                message: 'This username is already taken.',
            };
        }

        const newUser = {
            id: String(users.length + 1),
            firstName: trimmedFirstName,
            lastName: trimmedLastName,
            email: trimmedEmail,
            username: trimmedUsername,
            password: trimmedPassword,
            savedPlaces: [...guestSavedPlaces],
            trips: [],
            visitedPlaces: [],
        };

        setUsers((prev) => [...prev, newUser]);
        setCurrentUser(newUser);
        setGuestSavedPlaces([]);

        return {
            success: true,
            user: newUser,
        };
    };

    const logout = () => {
        setCurrentUser(null);
    };

    const getSavedPlaces = () => {
        if (currentUser) {
            return currentUser.savedPlaces || [];
        }
        return guestSavedPlaces;
    };

    const savePlace = (place) => {
        if (!place || !place.id) return;

        if (currentUser) {
            const alreadySaved = (currentUser.savedPlaces || []).some(
                (item) => item.id === place.id
            );

            if (alreadySaved) return;

            const updatedUser = {
                ...currentUser,
                savedPlaces: [...(currentUser.savedPlaces || []), place],
            };

            setCurrentUser(updatedUser);
            setUsers((prev) =>
                prev.map((user) => (user.id === updatedUser.id ? updatedUser : user))
            );
            return;
        }

        setGuestSavedPlaces((prev) => {
            const exists = prev.some((item) => item.id === place.id);
            if (exists) return prev;
            return [...prev, place];
        });
    };

    const removeSavedPlace = (placeId) => {
        if (!placeId) return;

        if (currentUser) {
            const updatedUser = {
                ...currentUser,
                savedPlaces: (currentUser.savedPlaces || []).filter(
                    (item) => item.id !== placeId
                ),
            };

            setCurrentUser(updatedUser);
            setUsers((prev) =>
                prev.map((user) => (user.id === updatedUser.id ? updatedUser : user))
            );
            return;
        }

        setGuestSavedPlaces((prev) => prev.filter((item) => item.id !== placeId));
    };

    const value = useMemo(
        () => ({
            users,
            currentUser,
            isLoggedIn,
            guestSavedPlaces,
            login,
            signup,
            logout,
            getSavedPlaces,
            savePlace,
            removeSavedPlace,
        }),
        [users, currentUser, isLoggedIn, guestSavedPlaces]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error('useAuth must be used inside AuthProvider.');
    }

    return context;
}