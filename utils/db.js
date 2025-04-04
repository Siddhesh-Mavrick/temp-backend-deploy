import mongoose from "mongoose";

export const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI)
        console.log("Mongo Db connected succesfully");
    }
    catch(error) {
        console.log(error);
    }
}
