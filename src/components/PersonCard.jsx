import { useNavigate } from "react-router-dom";

function PersonCard({ person }) {

  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/person/${person.publicId}`)}
      className="bg-white rounded-2xl shadow p-4 flex items-center gap-4 cursor-pointer hover:shadow-lg hover:scale-[1.02] transition"
    >
      <img
        src={person.avatar}
        alt={person.name}
        className="w-16 h-16 rounded-full object-cover"
      />

      <div className="flex-1">
        <h2 className="font-bold text-lg">
          {person.name}
        </h2>
      </div>
    </div>
  );
}

export default PersonCard;