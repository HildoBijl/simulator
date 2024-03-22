export function YouTubeVideo({ id, height = 400, width = height * 1.5 }) {
	if (!id)
		return null
	return <div className="video-responsive">
		<iframe width={width} height={height} src={`https://www.youtube.com/embed/${id}`} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title="Embedded YouTube" />
	</div>
}
