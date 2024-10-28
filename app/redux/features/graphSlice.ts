import { createSlice} from '@reduxjs/toolkit';

interface SensorData {
    bioImpedance: number;
    phaseAngle: number;
    time?: bigint | string;
}

interface GraphState {
    data: SensorData[];
}

const initialState: GraphState = {
    data: [],
};

function addTimeToData(data: SensorData[]): SensorData[] {
    return data.map((d) => {
        const timestamp = Number(d.time) * 1000; // Convert bigint to number and to milliseconds
        const date = new Date(timestamp);
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');
        return {
            ...d,
            time: `${hours}:${minutes}:${seconds}` // Format the time as HH:MM:SS
        };
    });
}

export const graphSlice = createSlice({
    name: 'graph',
    initialState,
    reducers: {
        addBio: (state, action) => {
        const dataWithTime = addTimeToData(action.payload);
         state.data = dataWithTime;
        },
    },
});

export const { addBio } = graphSlice.actions;
export default graphSlice.reducer;