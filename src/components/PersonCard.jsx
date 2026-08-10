import { useNavigate } from "react-router-dom";

function PersonCard({ person }) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/person/${person.publicId}`)}
      className="flex cursor-pointer items-center gap-4 rounded-2xl bg-white p-4 shadow transition hover:scale-[1.02] hover:shadow-lg"
    >
      <img
        src={person.avatar}
        alt={person.name}
        className="h-16 w-16 rounded-full object-cover"
      />

      <div className="flex-1">
        <h2 className="text-lg font-bold">
          {person.name}
        </h2>
      </div>
    </div>
  );
}

export default PersonCard;