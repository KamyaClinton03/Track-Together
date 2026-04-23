import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const ProgressChart = ({ data }) => (
  <div style={{ width: '100%', height: 300 }}>
    <ResponsiveContainer>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="progress" stroke="#4f46e5" />
      </LineChart>
    </ResponsiveContainer>
  </div>
);