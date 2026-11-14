import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import axios from 'axios'

const getErrorPayload = (error, fallback) =>
    error?.response?.data ?? { error: fallback }

export const fetchAddress = createAsyncThunk(
    'address/fetchAddress',
    async ({ getToken }, thunkAPI) => {
        try {
            const token = await getToken()
            const { data } = await axios.get('/api/address', {
                headers: { Authorization: `Bearer ${token}` },
            })
            return data ? data.addresses : []
        } catch (error) {
            return thunkAPI.rejectWithValue(
                getErrorPayload(error, 'Failed to fetch addresses')
            )
        }
    }
)

const addressSlice = createSlice({
    name: 'address',
    initialState: {
        list: [],
    },
    reducers: {
        addAddress: (state, action) => {
            state.list.push(action.payload)
        },
    },
    extraReducers: () => {
        // address fetching disabled
    },
})

export const { addAddress } = addressSlice.actions
export default addressSlice.reducer
