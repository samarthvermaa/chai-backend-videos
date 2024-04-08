import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const registerUser = asyncHandler(async (req, res) => {
  //create user object
  //remove password and refresh token fields
  //check for user creation
  //return response

  //get user details from frontend
  const { username, email, fullName, password } = req.body;
  console.log("email--->", req.body);

  //validate user
  if (
    [username, email, fullName, password].some(
      (field) => !(field && field.trim())
    )
  ) {
    throw new ApiError(400, "All fields are required");
  }
  console.log("User Validated");

  //check if user already exists : username and email
  const existedUser = await User.findOne({ email }); //User.findOne({ $or: [{ email }, { username }] });

  console.log("existedUser--->", existedUser);

  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists");
  }

  console.log("User does not exists");

  //check for images and check for avatar
  console.log(req.files);
  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  console.log("avatarLocalPath--->", avatarLocalPath);

  //upload image to cloudinary, avatar
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  console.log("avatar--->", avatar);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!avatar) {
    throw new ApiError(400, "Avatar not found");
  }

  const user = await User.create({
    username: username.toLowerCase(),
    email,
    fullName,
    password,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
  });

  const userCreated = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!userCreated) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, userCreated, "User Registered Successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  //body--> email or username and password
  // validate if user and email exits in the body
  //check user exist
  //if user exists then compare password
  //if password matches
  // provide access and refresh token as secure cookies
  // error password does not match
  //else
  // error user does not exists

  const { email, username, password } = req.body;

  if (!email || !username) {
    throw new ApiError(400, "User name or email is not provided");
  }

  const user = await User.findOne({ $or: [{ email }, { username }] });
  console.log("user--->", user);
  if (!user) {
    throw new ApiError(400, "User not found");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Username or password is wrong");
  }

  const { refreshToken, accessToken } = await generateAccessAndRefreshToken(
    user._id
  );
  console.log("refreshToken-->", refreshToken);

  const loggedInUser = User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "User Logged in Successfully"
      )
    );
});

const logout = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, {
    $set: { refreshToken: undefined },
  });

  const options = {
    httpOnly: true,
    secure: true,
  };

  res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { refreshToken, accessToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating the access and refresh tokens"
    );
  }
};

export { registerUser, loginUser, logout };
